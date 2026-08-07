/**
 * Name and lifetime of the booking confirmation cookie.
 *
 * Kept in its own module because a "use server" file may only export async
 * functions, and both the server action and the confirmation page need these
 * values.
 */
export const CONFIRMATION_COOKIE = 'havoheal_booking_ref';

/** Two hours: long enough to read the page, short enough to expire quickly. */
export const CONFIRMATION_TTL_SECONDS = 60 * 60 * 2;
