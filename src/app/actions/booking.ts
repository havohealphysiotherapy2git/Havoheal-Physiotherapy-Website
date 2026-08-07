'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { bookingSchema } from '@/lib/validation';
import {
  createBooking,
  getAvailabilityForDate,
  getBookingByReference,
  recordEmailOutcome,
} from '@/lib/bookings';
import { company } from '@/config/site';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { getClientIp, getUserAgent, verifyCaptcha } from '@/lib/request-context';
import { fingerprintRequest, rateLimitKey, signValue } from '@/lib/signed-value';
import { sendEmail, getBusinessNotificationAddress } from '@/lib/email/provider';
import {
  buildBusinessNotification,
  buildCustomerAcknowledgement,
} from '@/lib/email/templates';
import { checkDateBookable } from '@/lib/slots';
import { bookingConfig } from '@/config/booking';
import { CONFIRMATION_COOKIE, CONFIRMATION_TTL_SECONDS } from '@/lib/booking-cookie';

/**
 * Booking submission.
 *
 * Server Actions are used rather than a REST endpoint because Next.js gives
 * them CSRF protection by default (same-origin enforcement plus an action id
 * that cannot be forged from another site), and because the payload never needs
 * to be public API.
 *
 * Nothing sent by the browser is trusted: the payload is re-parsed with the
 * shared Zod schema, the slot is re-validated against configuration, and the
 * database has the final say on availability.
 */

export type BookingActionResult =
  | {
      status: 'success';
      reference: string;
      duplicate: boolean;
      /**
       * False when the booking was saved but the acknowledgement email could
       * not be sent. The booking still succeeded — the confirmation page shows
       * a support message rather than an error.
       */
      acknowledgementSent: boolean;
    }
  | { status: 'validation-error'; fieldErrors: Record<string, string>; message: string }
  /**
   * Only reachable when `maxBookingsPerSlot` is set to a number and that limit
   * is already reached. It never fires while capacity is unlimited, so a
   * patient is never told a time is taken merely because someone else chose it.
   */
  | { status: 'slot-at-capacity'; message: string; availableStarts: string[] }
  | { status: 'slot-invalid'; message: string }
  | { status: 'rate-limited'; message: string; retryAfterSeconds: number }
  | { status: 'bot-suspected'; message: string }
  | { status: 'server-error'; message: string };

export async function submitBooking(payload: unknown): Promise<BookingActionResult> {
  const ip = await getClientIp();

  // ---- Rate limiting -----------------------------------------------------
  const limit = rateLimit(
    rateLimitKey('booking', ip),
    rateLimits.booking.limit,
    rateLimits.booking.windowSeconds,
  );
  if (!limit.success) {
    return {
      status: 'rate-limited',
      retryAfterSeconds: limit.retryAfterSeconds,
      message: `You have submitted several booking requests in a short time. Please wait a few minutes, or call us on ${company.phoneDisplay} and we will arrange the visit for you.`,
    };
  }

  // ---- Validation --------------------------------------------------------
  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: 'validation-error',
      fieldErrors,
      message: 'Some details need checking before we can submit your request.',
    };
  }

  const data = parsed.data;

  // ---- Bot protection ----------------------------------------------------
  // The honeypot is invisible to people and is filled in by most naive bots.
  if (data.website && data.website.length > 0) {
    // Deliberately vague: a bot should not learn why it was rejected.
    return {
      status: 'bot-suspected',
      message: `We could not process this submission. Please call or message us on ${company.phoneDisplay} instead.`,
    };
  }

  const captchaOk = await verifyCaptcha(data.captchaToken, ip);
  if (!captchaOk) {
    return {
      status: 'bot-suspected',
      message: `We could not verify that this request came from a person. Please try again, or call us on ${company.phoneDisplay}.`,
    };
  }

  // ---- Persist -----------------------------------------------------------
  const userAgent = await getUserAgent();
  const result = await createBooking({
    data,
    requestFingerprint: fingerprintRequest(ip, userAgent),
  });

  if (!result.ok) {
    if (result.error === 'slot-at-capacity') {
      const availability = await getAvailabilityForDate(data.date).catch(() => []);
      return {
        status: 'slot-at-capacity',
        message:
          'We have reached the number of visits we can staff at that time. Your details have been kept — please choose another time, or contact us and we will do our best to fit you in.',
        availableStarts: availability.filter((slot) => slot.available).map((slot) => slot.start),
      };
    }

    if (result.error === 'slot-invalid') {
      return { status: 'slot-invalid', message: slotRejectionMessage(result.reason) };
    }

    return {
      status: 'server-error',
      message: `We could not save your booking request just now. Nothing has been lost — please try again, call us on ${company.phoneDisplay}, or email ${company.email}.`,
    };
  }

  // ---- Confirmation cookie ----------------------------------------------
  // The reference is signed into an httpOnly cookie rather than a query string,
  // so booking details never appear in a URL, referrer header or server log.
  const cookieStore = await cookies();
  cookieStore.set(CONFIRMATION_COOKIE, signValue(result.reference, CONFIRMATION_TTL_SECONDS), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CONFIRMATION_TTL_SECONDS,
  });

  // ---- Email -------------------------------------------------------------
  // The booking is already committed. A delivery failure is recorded against
  // the record and surfaced to the customer as a support message — it never
  // turns a saved booking into a failed one.
  //
  // A duplicate submission does not re-send: the original request already
  // triggered both emails.
  const acknowledgementSent = result.duplicate
    ? true
    : await sendBookingEmails(result.id, result.reference);

  return {
    status: 'success',
    reference: result.reference,
    duplicate: result.duplicate,
    acknowledgementSent,
  };
}

/**
 * Sends both booking emails and records each outcome.
 *
 * @returns whether the customer acknowledgement was delivered
 */
async function sendBookingEmails(bookingId: string, reference: string): Promise<boolean> {
  try {
    const booking = await getBookingByReference(reference);
    if (!booking) return false;

    const emailData = {
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

    const [customerResult, businessResult] = await Promise.all([
      sendEmail(buildCustomerAcknowledgement(emailData)),
      sendEmail(buildBusinessNotification(emailData, getBusinessNotificationAddress())),
    ]);

    await Promise.all([
      recordEmailOutcome(bookingId, 'customer', {
        status: customerResult.ok ? (customerResult.skipped ? 'SKIPPED' : 'SENT') : 'FAILED',
        ...(customerResult.ok ? {} : { errorCode: customerResult.code }),
      }),
      recordEmailOutcome(bookingId, 'business', {
        status: businessResult.ok ? (businessResult.skipped ? 'SKIPPED' : 'SENT') : 'FAILED',
        ...(businessResult.ok ? {} : { errorCode: businessResult.code }),
      }),
    ]);

    if (!customerResult.ok) {
      console.error('[booking] acknowledgement email failed', {
        reference,
        provider: customerResult.provider,
        code: customerResult.code,
      });
    }
    if (!businessResult.ok) {
      // The business not hearing about a booking is the more serious failure:
      // the customer is expecting a call that nobody knows to make.
      console.error('[booking] business notification failed — booking needs manual review', {
        reference,
        provider: businessResult.provider,
        code: businessResult.code,
      });
    }

    return customerResult.ok;
  } catch (error) {
    console.error('[booking] email step failed', {
      reference,
      error: error instanceof Error ? error.name : 'unknown',
    });
    await recordEmailOutcome(bookingId, 'customer', {
      status: 'FAILED',
      errorCode: 'unknown',
    });
    return false;
  }
}

function slotRejectionMessage(reason: string): string {
  switch (reason) {
    case 'past':
      return 'That date has already passed. Please choose an upcoming date.';
    case 'beyond-horizon':
      return `We take online bookings up to ${bookingConfig.bookingHorizonDays} days ahead. For a later date, please call or message us.`;
    case 'non-working-day':
      return 'We do not take appointments on that day. Please choose another date.';
    case 'blocked':
      return 'We are closed on that date. Please choose another date.';
    case 'too-soon':
      return `We need at least ${bookingConfig.minimumNoticeHours} hours' notice for an online booking. Please choose a later time, or call us if it is urgent.`;
    case 'invalid-slot':
      return 'That appointment time is not one we offer. Please choose a time from the list.';
    default:
      return 'Please check the date and time and try again.';
  }
}

// ---------------------------------------------------------------------------
// Availability lookup used by the booking form when a date is chosen
// ---------------------------------------------------------------------------

const availabilityInput = z.object({ date: z.string() });

export type AvailabilityResult =
  | { status: 'ok'; date: string; slots: { start: string; end: string; available: boolean; reason?: string }[] }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

export async function fetchAvailability(input: unknown): Promise<AvailabilityResult> {
  const parsed = availabilityInput.safeParse(input);
  if (!parsed.success) {
    return { status: 'error', message: 'Please choose a valid date.' };
  }

  const ip = await getClientIp();
  const limit = rateLimit(
    rateLimitKey('availability', ip),
    rateLimits.availability.limit,
    rateLimits.availability.windowSeconds,
  );
  if (!limit.success) {
    return { status: 'error', message: 'Too many requests. Please wait a moment and try again.' };
  }

  const dateProblem = checkDateBookable(parsed.data.date);
  if (dateProblem) {
    return { status: 'unavailable', message: slotRejectionMessage(dateProblem) };
  }

  try {
    const slots = await getAvailabilityForDate(parsed.data.date);
    return {
      status: 'ok',
      date: parsed.data.date,
      slots: slots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        available: slot.available,
        ...(slot.unavailableReason ? { reason: slot.unavailableReason } : {}),
      })),
    };
  } catch (error) {
    console.error('[booking] availability lookup failed', {
      date: parsed.data.date,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return {
      status: 'error',
      message: `We could not load available times just now. Please try again, or call us on ${company.phoneDisplay}.`,
    };
  }
}
