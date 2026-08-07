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

export type AdminActionResult = { ok: true; message: string } | { ok: false; message: string };

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
        revalidatePath('/admin/bookings');
        return { ok: true, message: 'Booking confirmed.' };
      }

      case 'cancel': {
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
        revalidatePath('/admin/bookings');
        return { ok: true, message: 'Booking cancelled and the slot released.' };
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
        revalidatePath('/admin/bookings');
        return { ok: true, message: 'Booking rescheduled. Remember to tell the customer.' };
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
