import 'server-only';
import { prisma, isUniqueViolation } from '@/lib/prisma';
import { bookingConfig } from '@/config/booking';
import {
  businessTimeToUtc,
  checkSlotBookable,
  getSlotAvailability,
  getSlotEnd,
  type SlotAvailability,
  type SlotCounts,
  type SlotRejection,
} from '@/lib/slots';
import { generateBookingReference } from '@/lib/utils';
import { toUkE164, type BookingInput } from '@/lib/validation';

/**
 * Booking data access.
 *
 * CAPACITY MODEL — this is not a one-patient-per-slot system.
 *
 * The business dispatches several physiotherapists, so one patient requesting
 * 10:00 does not stop another patient requesting 10:00. A patient chooses a
 * PREFERRED date and time; the business confirms it afterwards.
 *
 * `bookingConfig.maxBookingsPerSlot` controls this:
 *   null (current) → unlimited. No occupancy check runs anywhere.
 *   n              → at most n live requests per slot, enforced in the UI and
 *                    again inside the insert transaction.
 *
 * Blocked dates are a separate, still-enforced rule: a closed date cannot be
 * requested regardless of capacity.
 */

/**
 * Statuses that count towards a slot's capacity. Cancelled requests do not.
 * Only consulted when `maxBookingsPerSlot` is a number.
 */
export const LIVE_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED'] as const;

export type CreateBookingResult =
  | { ok: true; reference: string; id: string; duplicate: boolean }
  | { ok: false; error: 'slot-at-capacity' }
  | { ok: false; error: 'slot-invalid'; reason: SlotRejection }
  | { ok: false; error: 'database' };

/**
 * The audit-trail description of how a customer accepted the terms.
 *
 * Kept as a constant so the wording is identical on every booking and can be
 * searched for, and so it is obvious that it describes click-wrap acceptance
 * rather than a ticked checkbox.
 */
export const TERMS_ACCEPTANCE_DETAIL =
  'Accepted by submitting the booking form, under the notice shown above the submit button linking to the Privacy Policy and the Booking and Cancellation Policy, and agreeing to contact about this booking. Not a ticked checkbox. Not marketing consent.';

/** True when a per-slot limit is configured at all. */
export function isCapacityLimited(): boolean {
  return bookingConfig.maxBookingsPerSlot !== null;
}

/**
 * How many live requests exist for each start time on a date.
 * Returns an empty map when capacity is unlimited — there is nothing to count,
 * and the query is skipped entirely.
 */
export async function getSlotCounts(dateIso: string): Promise<SlotCounts> {
  if (!isCapacityLimited()) return {};

  const rows = await prisma.booking.groupBy({
    by: ['startTime'],
    where: { date: dateIso, status: { in: [...LIVE_STATUSES] } },
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.startTime, row._count._all]));
}

/** Availability for one date: configuration rules, plus capacity if limited. */
export async function getAvailabilityForDate(
  dateIso: string,
  now: Date = new Date(),
): Promise<SlotAvailability[]> {
  return getSlotAvailability(dateIso, await getSlotCounts(dateIso), now);
}

/**
 * Dates on which every slot has reached the configured limit.
 *
 * With unlimited capacity this is always empty — a date can never fill up, so
 * no database query is made.
 */
export async function getFullyBookedDates(
  dates: string[],
  now: Date = new Date(),
): Promise<string[]> {
  const capacity = bookingConfig.maxBookingsPerSlot;
  if (capacity === null || dates.length === 0) return [];

  const rows = await prisma.booking.groupBy({
    by: ['date', 'startTime'],
    where: { date: { in: dates }, status: { in: [...LIVE_STATUSES] } },
    _count: { _all: true },
  });

  const countsByDate = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const forDate = countsByDate.get(row.date) ?? {};
    forDate[row.startTime] = row._count._all;
    countsByDate.set(row.date, forDate);
  }

  const full: string[] = [];
  for (const [date, counts] of countsByDate) {
    const availability = getSlotAvailability(date, counts, now);
    if (availability.every((slot) => !slot.available)) full.push(date);
  }
  return full;
}

/** Dates blocked in the database, merged with the config list by the caller. */
export async function getBlockedDatesFromDb(): Promise<string[]> {
  const rows = await prisma.blockedDate.findMany({ select: { date: true } });
  return rows.map((row) => row.date);
}

type CreateBookingArgs = {
  data: BookingInput;
  /** Coarse request metadata for abuse investigation. Never a raw IP. */
  requestFingerprint?: string;
  now?: Date;
};

/**
 * Creates a booking.
 *
 * Idempotent: submitting the same `idempotencyKey` twice returns the original
 * booking with `duplicate: true` rather than creating a second appointment.
 */
export async function createBooking({
  data,
  requestFingerprint,
  now = new Date(),
}: CreateBookingArgs): Promise<CreateBookingResult> {
  // Re-validate the slot against configuration on the server. The client cannot
  // widen opening hours, book a closed day, or slip past the notice period.
  const slotProblem = checkSlotBookable(data.date, data.startTime, now);
  if (slotProblem) return { ok: false, error: 'slot-invalid', reason: slotProblem };

  const endTime = getSlotEnd(data.startTime);
  if (!endTime) return { ok: false, error: 'slot-invalid', reason: 'invalid-slot' };

  // Replay of a previous submission — return the original booking.
  const existing = await prisma.booking.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { id: true, reference: true },
  });
  if (existing) {
    return { ok: true, id: existing.id, reference: existing.reference, duplicate: true };
  }

  // A date blocked by an administrator after the page was rendered.
  const dbBlocked = await prisma.blockedDate.findUnique({ where: { date: data.date } });
  if (dbBlocked) return { ok: false, error: 'slot-invalid', reason: 'blocked' };

  const status = bookingConfig.autoConfirmBookings ? 'CONFIRMED' : 'PENDING';

  // Retry only for reference collisions, which are astronomically unlikely but
  // cheap to handle.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = generateBookingReference();

    try {
      const booking = await prisma.$transaction(async (tx) => {
        /**
         * Capacity check, and only when a limit is configured.
         *
         * With `maxBookingsPerSlot: null` no query runs and any number of
         * patients may request the same date and time. Nothing here rejects a
         * request merely because another booking exists at that time.
         */
        const capacity = bookingConfig.maxBookingsPerSlot;
        if (capacity !== null) {
          const taken = await tx.booking.count({
            where: {
              date: data.date,
              startTime: data.startTime,
              status: { in: [...LIVE_STATUSES] },
            },
          });
          if (taken >= capacity) throw new SlotAtCapacityError();
        }

        const created = await tx.booking.create({
          data: {
            reference,
            date: data.date,
            startTime: data.startTime,
            endTime,
            startsAt: businessTimeToUtc(data.date, data.startTime),
            durationMinutes: bookingConfig.slotDurationMinutes,
            priceInPence: bookingConfig.priceInPence,
            fullName: data.fullName,
            email: data.email,
            // Stored in E.164 so it is unambiguous and dialable from anywhere.
            phone: toUkE164(data.phoneNumber),
            postcode: data.postcode,
            address: data.address,
            addressFlat: data.addressFlat?.trim() || null,
            addressBuilding: data.addressBuilding?.trim() || null,
            accessInstructions: data.accessInstructions?.trim() || null,
            parkingInformation: data.parkingInformation?.trim() || null,
            importantMessage: data.importantMessage?.trim() || null,
            /**
             * These record that the terms were PRESENTED AND ACCEPTED, not
             * that six boxes were ticked — those were removed from the form.
             *
             * `true` is the accurate value: the review step shows a notice
             * directly above the submit button stating that submitting means
             * agreeing to the Privacy Policy and the Booking and Cancellation
             * Policy, and to being contacted about this request, with a link to
             * each policy. Submitting is therefore acceptance (click-wrap), and
             * `consentedAt` is when it happened.
             *
             * Writing `false` would be worse, not more honest: it would read as
             * "the customer refused", which is untrue and would also contradict
             * our contacting them about their own booking.
             *
             * None of this is GDPR consent — booking data is processed under
             * Article 6(1)(b) — and none of it is marketing permission.
             *
             * The BookingEvent written below records HOW acceptance was given,
             * so click-wrap rows are distinguishable from the older tick-box
             * ones without a schema change.
             *
             * `confirmedServiceArea`, `confirmedAddressAccurate` and
             * `confirmedRequestNotBooking` are deliberately NOT set: those
             * declarations are no longer asked for, so they keep their `false`
             * database default, meaning "not collected".
             */
            consentPrivacy: true,
            consentPolicy: true,
            consentContact: true,
            consentedAt: now,
            status,
            idempotencyKey: data.idempotencyKey,
            requestFingerprint: requestFingerprint ?? null,
          },
          select: { id: true, reference: true },
        });

        await tx.bookingEvent.create({
          data: {
            bookingId: created.id,
            type: 'created',
            actor: 'customer',
            detail: `Booking request submitted for ${data.date} ${data.startTime}.`,
          },
        });

        /**
         * Records HOW the terms were accepted, in the same transaction as the
         * booking itself.
         *
         * This is what keeps the audit trail honest after the six tick-boxes
         * were removed: a booking carrying this event was accepted by
         * submitting under the notice, whereas an older booking without it was
         * accepted by ticking boxes. The boolean columns alone could not tell
         * the two apart, and no schema change is needed to distinguish them.
         */
        await tx.bookingEvent.create({
          data: {
            bookingId: created.id,
            type: 'terms-accepted',
            actor: 'customer',
            detail: TERMS_ACCEPTANCE_DETAIL,
          },
        });

        return created;
      });

      return { ok: true, id: booking.id, reference: booking.reference, duplicate: false };
    } catch (error) {
      if (error instanceof SlotAtCapacityError) {
        return { ok: false, error: 'slot-at-capacity' };
      }

      if (isUniqueViolation(error)) {
        const target = uniqueViolationTarget(error);

        // A concurrent submit with the same idempotency key won the race.
        if (target.includes('idempotencyKey')) {
          const winner = await prisma.booking.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
            select: { id: true, reference: true },
          });
          if (winner) {
            return { ok: true, id: winner.id, reference: winner.reference, duplicate: true };
          }
        }

        // Reference collision — generate a new one and try again.
        if (target.includes('reference')) continue;
      }

      console.error('[booking] create failed', {
        // Never log customer details. Slot and error class only.
        date: data.date,
        startTime: data.startTime,
        error: error instanceof Error ? error.message : 'unknown',
      });
      return { ok: false, error: 'database' };
    }
  }

  return { ok: false, error: 'database' };
}

/**
 * Thrown only when a configured `maxBookingsPerSlot` limit is already reached.
 * It can never be thrown while capacity is unlimited.
 */
class SlotAtCapacityError extends Error {
  constructor() {
    super('slot-at-capacity');
    this.name = 'SlotAtCapacityError';
  }
}

function uniqueViolationTarget(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'meta' in error &&
    typeof (error as { meta?: unknown }).meta === 'object'
  ) {
    const meta = (error as { meta: { target?: unknown } }).meta;
    if (Array.isArray(meta.target)) return meta.target.join(',');
    if (typeof meta.target === 'string') return meta.target;
  }
  return '';
}

/** Full booking record used by the confirmation page and emails. */
export async function getBookingByReference(reference: string) {
  return prisma.booking.findUnique({ where: { reference } });
}

/**
 * Records the outcome of a transactional email against the booking.
 *
 * Never throws: a booking is already safely saved by the time this runs, and
 * losing the delivery record must not turn a successful booking into an error.
 * Only a short error CODE is stored — never a provider payload, which could
 * contain personal data.
 */
export async function recordEmailOutcome(
  bookingId: string,
  which: 'customer' | 'business',
  outcome: { status: 'SENT' | 'FAILED' | 'SKIPPED'; errorCode?: string },
): Promise<void> {
  const sentAt = outcome.status === 'FAILED' ? null : new Date();

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(which === 'customer'
          ? { customerEmailStatus: outcome.status, customerEmailSentAt: sentAt }
          : { businessEmailStatus: outcome.status, businessEmailSentAt: sentAt }),
        ...(outcome.status === 'FAILED'
          ? {
              emailLastErrorCode: outcome.errorCode ?? 'unknown',
              emailRetryCount: { increment: 1 },
            }
          : {}),
      },
    });
  } catch (error) {
    console.error('[booking] could not record email outcome', {
      bookingId,
      which,
      status: outcome.status,
      error: error instanceof Error ? error.name : 'unknown',
    });
  }
}

/**
 * Bookings whose email did not go out. Used by the admin area, and by any
 * retry job added later — see docs/email-setup.md.
 */
export async function getBookingsWithFailedEmail(limit = 50) {
  return prisma.booking.findMany({
    where: {
      OR: [{ customerEmailStatus: 'FAILED' }, { businessEmailStatus: 'FAILED' }],
      status: { in: [...LIVE_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function recordBookingEvent(
  bookingId: string,
  type: string,
  actor: string,
  detail?: string,
): Promise<void> {
  await prisma.bookingEvent.create({ data: { bookingId, type, actor, detail } });
}
