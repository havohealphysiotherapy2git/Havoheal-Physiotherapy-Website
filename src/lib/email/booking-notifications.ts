import 'server-only';

import { prisma } from '@/lib/prisma';
import { recordEmailOutcome } from '@/lib/bookings';
import { sendEmail } from '@/lib/email/provider';
import {
  buildBookingCancellation,
  buildBookingConfirmation,
  buildBookingReschedule,
  type BookingEmailData,
} from '@/lib/email/templates';

/**
 * Patient emails sent when an administrator changes a booking.
 *
 * This deliberately reuses the same `sendEmail` provider abstraction and the
 * same `recordEmailOutcome` delivery tracking as the new-booking flow — there
 * is one email system, not two.
 *
 * Contract, matching the new-booking flow:
 *  - Called only AFTER the database update has committed.
 *  - Never throws. A booking change that is already saved must not be reported
 *    as a failure because the mail provider was unreachable.
 *  - Returns whether the patient was actually emailed, so the admin UI can say
 *    so honestly rather than implying a message went out.
 */

export type StatusEmailKind = 'confirmed' | 'rescheduled' | 'cancelled';

export type StatusEmailResult = {
  /** True only when the provider accepted the message. */
  sent: boolean;
  /** True when sending is intentionally suppressed (EMAIL_PROVIDER=console). */
  skipped: boolean;
  /** Short, non-sensitive code for the admin log. Never a provider payload. */
  errorCode?: string;
};

/** Maps a booking row onto the shape the templates expect. */
function toEmailData(booking: {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
  addressFlat: string | null;
  addressBuilding: string | null;
  accessInstructions: string | null;
  parkingInformation: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceInPence: number;
  importantMessage: string | null;
  status: BookingEmailData['status'];
  createdAt: Date;
}): BookingEmailData {
  return {
    reference: booking.reference,
    fullName: booking.fullName,
    email: booking.email,
    phone: booking.phone,
    postcode: booking.postcode,
    address: booking.address,
    addressFlat: booking.addressFlat,
    addressBuilding: booking.addressBuilding,
    accessInstructions: booking.accessInstructions,
    parkingInformation: booking.parkingInformation,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationMinutes: booking.durationMinutes,
    priceInPence: booking.priceInPence,
    importantMessage: booking.importantMessage,
    status: booking.status,
    createdAt: booking.createdAt,
  };
}

/**
 * Sends the patient email for a status change, records the delivery outcome
 * against the booking, and writes an audit event either way.
 *
 * @param previousSlot the slot the visit moved FROM, for reschedule emails
 * @param actor        who triggered it, for the audit trail
 */
export async function sendBookingStatusEmail(
  bookingId: string,
  kind: StatusEmailKind,
  options: {
    actor: string;
    previousSlot?: { date: string; startTime: string } | null;
  },
): Promise<StatusEmailResult> {
  try {
    // Re-read after the update so the email always reflects committed state —
    // never the values the admin form happened to post.
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return { sent: false, skipped: false, errorCode: 'booking_missing' };
    }

    const data = toEmailData(booking);

    const message =
      kind === 'confirmed'
        ? buildBookingConfirmation(data)
        : kind === 'rescheduled'
          ? buildBookingReschedule(data, options.previousSlot ?? null)
          : buildBookingCancellation(data);

    const result = await sendEmail(message);

    const status = result.ok ? (result.skipped ? 'SKIPPED' : 'SENT') : 'FAILED';

    // Reuses the customer email columns: they track the most recent patient
    // email for this booking, which is what the admin screen displays.
    await recordEmailOutcome(bookingId, 'customer', {
      status,
      ...(result.ok ? {} : { errorCode: result.code }),
    });

    // The audit trail records the attempt whether or not it succeeded, so a
    // silent non-delivery is visible on the booking rather than only in logs.
    await prisma.bookingEvent
      .create({
        data: {
          bookingId,
          type: result.ok ? `email-sent:${kind}` : `email-failed:${kind}`,
          actor: options.actor,
          detail: result.ok
            ? result.skipped
              ? `${kind} email suppressed (EMAIL_PROVIDER=console).`
              : `${kind} email sent to the patient.`
            : `${kind} email could not be sent (${result.code}). Contact the patient directly.`,
        },
      })
      .catch(() => undefined);

    if (!result.ok) {
      console.error('[admin] patient status email failed', {
        reference: booking.reference,
        kind,
        provider: result.provider,
        code: result.code,
      });
    }

    return {
      sent: result.ok && !result.skipped,
      skipped: Boolean(result.ok && result.skipped),
      ...(result.ok ? {} : { errorCode: result.code }),
    };
  } catch (error) {
    // Swallowed on purpose: the booking change is already committed.
    console.error('[admin] patient status email step threw', {
      bookingId,
      kind,
      error: error instanceof Error ? error.name : 'unknown',
    });
    await recordEmailOutcome(bookingId, 'customer', {
      status: 'FAILED',
      errorCode: 'unknown',
    }).catch(() => undefined);
    return { sent: false, skipped: false, errorCode: 'unknown' };
  }
}
