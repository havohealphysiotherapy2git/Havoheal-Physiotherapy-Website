'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { adminBookingActionSchema, adminLoginSchema } from '@/lib/validation';
import {
  checkAdminCredentials,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from '@/lib/admin-auth';
import { isAdminConfigured } from '@/lib/env';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-context';
import { rateLimitKey } from '@/lib/signed-value';
import { businessTimeToUtc, checkSlotBookable, getSlotEnd } from '@/lib/slots';
import { LIVE_STATUSES } from '@/lib/bookings';
import {
  sendBookingStatusEmail,
  type StatusEmailResult,
} from '@/lib/email/booking-notifications';
import { bookingConfig } from '@/config/booking';

export type AdminLoginResult = { status: 'error'; message: string } | { status: 'success' };

export async function adminLogin(
  _prev: AdminLoginResult | null,
  formData: FormData,
): Promise<AdminLoginResult> {
  if (!isAdminConfigured()) {
    return {
      status: 'error',
      message: 'Admin access is not configured on this deployment.',
    };
  }

  const ip = await getClientIp();
  const limit = rateLimit(
    rateLimitKey('admin-login', ip),
    rateLimits.adminLogin.limit,
    rateLimits.adminLogin.windowSeconds,
  );
  if (!limit.success) {
    return {
      status: 'error',
      message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
    };
  }

  const parsed = adminLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  // A single generic message for every failure: no account enumeration.
  const genericFailure: AdminLoginResult = {
    status: 'error',
    message: 'Those sign-in details were not recognised.',
  };

  if (!parsed.success) return genericFailure;
  if (!checkAdminCredentials(parsed.data.email, parsed.data.password)) {
    console.warn('[admin] failed sign-in attempt');
    return genericFailure;
  }

  await createAdminSession(parsed.data.email.trim().toLowerCase());
  redirect('/admin/bookings');
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
  redirect('/admin/login');
}

export type AdminActionResult =
  | {
      ok: true;
      message: string;
      /**
       * "warning" means the change was saved but something needs the admin's
       * attention — almost always that the patient email did not go out, so
       * they must be told another way.
       */
      tone?: 'success' | 'warning';
    }
  | { ok: false; message: string; tone?: 'success' | 'warning' };

/** Amber rather than green whenever the patient was not actually emailed. */
function emailTone(email: StatusEmailResult): { tone: 'success' | 'warning' } {
  return { tone: email.sent ? 'success' : 'warning' };
}

/**
 * The sentence appended to the admin's confirmation message.
 *
 * It always states plainly whether the patient was emailed. Saying "confirmed"
 * while the email silently failed is how a patient ends up expecting a visit
 * nobody told them about.
 */
function emailNote(email: StatusEmailResult, kind: string): string {
  if (email.sent) return `The patient has been sent a ${kind} email.`;
  if (email.skipped) {
    return `No ${kind} email was sent because email sending is disabled on this deployment (EMAIL_PROVIDER=console).`;
  }
  return `The ${kind} email could NOT be sent (${email.errorCode ?? 'unknown'}). Please contact the patient directly — the booking change itself has been saved.`;
}

/**
 * Applies an administrative change to a booking.
 *
 * Mass assignment is not possible: the action accepts a fixed enum plus, for a
 * reschedule, a date and time that are re-validated against the slot rules. No
 * caller-supplied object is ever spread into the update.
 */
export async function updateBooking(input: unknown): Promise<AdminActionResult> {
  const session = await requireAdmin();

  const parsed = adminBookingActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'That request was not valid.' };

  const { bookingId, action, date, startTime, note } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, message: 'That booking no longer exists.' };

  try {
    switch (action) {
      case 'confirm': {
        // Guard against a double-click or a second admin acting on the same
        // booking: re-confirming would email the patient the same thing twice.
        if (booking.status === 'CONFIRMED') {
          return {
            ok: true,
            tone: 'warning',
            message:
              'This booking was already confirmed, so no further email was sent to the patient.',
          };
        }

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
          }),
          prisma.bookingEvent.create({
            data: {
              bookingId,
              type: 'confirmed',
              actor: session.email,
              detail: `Confirmed for ${booking.date} ${booking.startTime}.`,
            },
          }),
        ]);

        // Database first, email second. A delivery failure never undoes the
        // confirmation — it is reported to the admin instead.
        const email = await sendBookingStatusEmail(bookingId, 'confirmed', {
          actor: session.email,
        });

        revalidatePath('/admin/bookings');
        return {
          ok: true,
          ...emailTone(email),
          message: `Booking confirmed. ${emailNote(email, 'confirmation')}`,
        };
      }

      case 'cancel': {
        if (booking.status === 'CANCELLED') {
          return {
            ok: true,
            tone: 'warning',
            message:
              'This booking was already cancelled, so no further email was sent to the patient.',
          };
        }

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          }),
          prisma.bookingEvent.create({
            data: {
              bookingId,
              type: 'cancelled',
              actor: session.email,
              detail: 'Booking cancelled; slot released.',
            },
          }),
        ]);

        const email = await sendBookingStatusEmail(bookingId, 'cancelled', {
          actor: session.email,
        });

        revalidatePath('/admin/bookings');
        return {
          ok: true,
          ...emailTone(email),
          message: `Booking cancelled and the slot released. ${emailNote(email, 'cancellation')}`,
        };
      }

      case 'complete': {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          }),
          prisma.bookingEvent.create({
            data: { bookingId, type: 'completed', actor: session.email },
          }),
        ]);
        revalidatePath('/admin/bookings');
        return { ok: true, message: 'Booking marked complete.' };
      }

      case 'reschedule': {
        if (!date || !startTime) {
          return { ok: false, message: 'Choose a new date and time.' };
        }

        const problem = checkSlotBookable(date, startTime);
        if (problem) {
          return { ok: false, message: `That slot cannot be used (${problem}).` };
        }

        const endTime = getSlotEnd(startTime);
        if (!endTime) return { ok: false, message: 'That time is not a valid slot.' };

        /**
         * Capacity check, and only when a limit is configured. Staff must be
         * able to move a visit onto a time another patient already has —
         * several physiotherapists go out at once.
         */
        const capacity = bookingConfig.maxBookingsPerSlot;
        if (capacity !== null) {
          const taken = await prisma.booking.count({
            where: {
              date,
              startTime,
              status: { in: [...LIVE_STATUSES] },
              NOT: { id: bookingId },
            },
          });
          if (taken >= capacity) {
            return {
              ok: false,
              message: `That time already has ${taken} visit(s) booked, which is the configured limit of ${capacity}. Raise maxBookingsPerSlot or choose another time.`,
            };
          }
        }

        // Nothing actually moved — do not email the patient about a change
        // that did not happen.
        if (booking.date === date && booking.startTime === startTime) {
          return {
            ok: true,
            tone: 'warning',
            message:
              'That is already the booked date and time, so nothing changed and no email was sent.',
          };
        }

        const previousSlot = { date: booking.date, startTime: booking.startTime };

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: {
              date,
              startTime,
              endTime,
              startsAt: businessTimeToUtc(date, startTime),
              status: 'RESCHEDULED',
              rescheduledFrom: `${booking.date} ${booking.startTime}`,
            },
          }),
          prisma.bookingEvent.create({
            data: {
              bookingId,
              type: 'rescheduled',
              actor: session.email,
              detail: `Moved from ${booking.date} ${booking.startTime} to ${date} ${startTime}.`,
            },
          }),
        ]);

        // The email is built from the re-read booking, so it always shows the
        // NEW slot; `previousSlot` is passed so it can also show what changed.
        const email = await sendBookingStatusEmail(bookingId, 'rescheduled', {
          actor: session.email,
          previousSlot,
        });

        revalidatePath('/admin/bookings');
        return {
          ok: true,
          ...emailTone(email),
          message: `Booking rescheduled. ${emailNote(email, 'reschedule')}`,
        };
      }

      case 'note': {
        // Staff notes live in their own column, kept separate from anything the
        // customer wrote, so internal commentary can never be confused with it.
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { staffNotes: note?.trim() || null },
          }),
          prisma.bookingEvent.create({
            data: { bookingId, type: 'note-updated', actor: session.email },
          }),
        ]);
        revalidatePath('/admin/bookings');
        return { ok: true, message: 'Internal note saved.' };
      }

      default:
        return { ok: false, message: 'Unknown action.' };
    }
  } catch (error) {
    console.error('[admin] booking update failed', {
      action,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return { ok: false, message: 'That change could not be saved. Please try again.' };
  }
}
