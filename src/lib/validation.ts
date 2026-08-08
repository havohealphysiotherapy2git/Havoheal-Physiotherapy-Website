import { z } from 'zod';
import { bookingConfig } from '@/config/booking';
import { isIsoDate, isValidSlotStart } from '@/lib/slots';

/**
 * Validation schemas shared by the client form and the server action.
 *
 * This module is isomorphic on purpose: the browser gets fast inline feedback
 * and the server re-validates everything from scratch. Client-side validation
 * is never trusted — the server action parses the raw payload with these same
 * schemas before touching the database.
 */

// UK postcode, tolerant of missing/multiple spaces and any casing.
const UK_POSTCODE =
  /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/**
 * Phone numbers are UK only, stored in E.164 form (for example
 * "+447123456789").
 *
 * The "+44" is fixed in the UI, so the customer types the national part alone.
 * The service area is Birmingham, so there is no country to choose, and fixing
 * the prefix removes the commonest cause of malformed numbers.
 */
export const UK_DIAL_CODE = '+44';

/**
 * A UK national number: 9 or 10 digits, and never starting with 0 or 4.
 *
 * The leading digit identifies the number range — 7 for mobiles, 1/2/3 for
 * geographic and non-geographic landlines, 5/8/9 for service numbers. No UK
 * number begins with 4, which is what makes stripping a mistyped "44" safe.
 */
const UK_NATIONAL_NUMBER = /^[1235789]\d{8,9}$/;

/** Normalises "b152tt" → "B15 2TT". Returns the trimmed input if unparseable. */
export function normalisePostcode(input: string): string {
  const compact = input.replace(/\s+/g, '').toUpperCase();
  if (compact.length < 5 || compact.length > 7) return input.trim().toUpperCase();
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`;
}

/** Strips spaces, hyphens, brackets and dots from a phone number. */
export function normalisePhone(input: string): string {
  return input.replace(/[\s().-]/g, '');
}

/** Just the digits of a national number, with formatting removed. */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Reduces whatever the customer typed to a bare UK national number.
 *
 * People paste numbers in every shape, and the field already shows "+44", so
 * all of these must end up identical rather than producing "+4407123456789":
 *
 *   "07123 456789"    → "7123456789"   (trunk zero dropped)
 *   "7123 456789"     → "7123456789"   (already correct)
 *   "+44 7123 456789" → "7123456789"   (prefix typed anyway)
 *   "0044 7123456789" → "7123456789"   (international access code)
 *   "44 7123 456789"  → "7123456789"   (country code without the plus)
 */
export function toUkNationalNumber(input: string): string {
  let digits = phoneDigits(input);

  if (digits.startsWith('0044')) digits = digits.slice(4);
  else if (digits.startsWith('44') && digits.length > 10) digits = digits.slice(2);

  // Only ever one trunk zero, so "0044…" handled above cannot be re-trimmed.
  if (digits.startsWith('0')) digits = digits.slice(1);

  return digits;
}

/**
 * Normalises to E.164 for storage, e.g. "07123 456789" → "+447123456789".
 * Never produces "+440…" — the trunk zero is removed first.
 */
export function toUkE164(input: string): string {
  return `${UK_DIAL_CODE}${toUkNationalNumber(input)}`;
}

/** True when the input reduces to a plausible UK number. */
export function isValidUkPhone(input: string): boolean {
  return UK_NATIONAL_NUMBER.test(toUkNationalNumber(input));
}

/** Collapses whitespace and trims. Applied to every free-text field. */
export function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Removes control characters that have no place in a stored form value.
 * Newlines and tabs are kept for genuinely multi-line fields.
 */
export function stripControlCharacters(input: string, allowNewlines = false): string {
  const pattern = allowNewlines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  return input.replace(pattern, '');
}

// ---------------------------------------------------------------------------
// Step 1 — date and time
// ---------------------------------------------------------------------------

export const slotSchema = z.object({
  date: z
    .string()
    .min(1, 'Choose a date for your appointment.')
    .refine(isIsoDate, 'That date is not valid. Choose a date from the calendar.'),
  startTime: z
    .string()
    .min(1, 'Choose an appointment time.')
    .refine(
      (value) => isValidSlotStart(value),
      'That appointment time is not one we offer. Choose a time from the list.',
    ),
});

export type SlotInput = z.infer<typeof slotSchema>;

// ---------------------------------------------------------------------------
// Phone fields, shared by the booking and contact forms
// ---------------------------------------------------------------------------

/**
 * The UK number, required. Spaces and common separators are accepted and
 * stripped; the stored value is always the bare national number, which the
 * server turns into E.164.
 */
const requiredUkPhone = z
  .string()
  .trim()
  .min(1, 'Enter a phone number we can reach you on.')
  .max(24, 'That phone number is too long.')
  .refine(
    (value) => /^[\d\s().+-]+$/.test(value),
    'Use numbers only — for example 7123 456789.',
  )
  .refine(isValidUkPhone, 'Enter a valid UK phone number, for example 7123 456789.')
  .transform(toUkNationalNumber);

/** The same rules, but the field may be left empty. */
const optionalUkPhone = z
  .string()
  .trim()
  .max(24, 'That phone number is too long.')
  .refine(
    (value) => value === '' || /^[\d\s().+-]+$/.test(value),
    'Use numbers only — for example 7123 456789.',
  )
  .refine(
    (value) => value === '' || isValidUkPhone(value),
    'Enter a valid UK phone number, or leave this blank.',
  )
  .transform((value) => (value === '' ? '' : toUkNationalNumber(value)))
  .optional()
  .or(z.literal(''));

// ---------------------------------------------------------------------------
// Step 2 — customer details
// ---------------------------------------------------------------------------

export const customerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name.')
    .max(120, 'Your name must be 120 characters or fewer.')
    .transform(collapseWhitespace),

  phoneNumber: requiredUkPhone,

  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address so we can send your acknowledgement.')
    .max(200, 'That email address is too long.')
    .email('Enter a valid email address, for example name@example.com.')
    .transform((value) => value.toLowerCase()),

  postcode: z
    .string()
    .trim()
    .min(1, 'Enter your postcode so we can check we cover your area.')
    .max(10, 'That postcode is too long.')
    .refine((value) => UK_POSTCODE.test(value), 'Enter a valid UK postcode, for example B15 2TT.')
    .transform(normalisePostcode),

  address: z
    .string()
    .trim()
    .min(5, 'Enter the address for the visit, including the street name.')
    .max(300, 'The address must be 300 characters or fewer.')
    .transform((value) => stripControlCharacters(collapseWhitespace(value))),

  // ---- Optional home-visit detail -------------------------------------
  // None of these are required: a visitor must never be blocked from booking
  // because they live in a house rather than a flat.

  addressFlat: z
    .string()
    .trim()
    .max(60, 'Please keep this under 60 characters.')
    .transform((value) => stripControlCharacters(collapseWhitespace(value)))
    .optional()
    .or(z.literal('')),

  addressBuilding: z
    .string()
    .trim()
    .max(120, 'Please keep this under 120 characters.')
    .transform((value) => stripControlCharacters(collapseWhitespace(value)))
    .optional()
    .or(z.literal('')),

  accessInstructions: z
    .string()
    .trim()
    .max(500, 'Please keep access instructions under 500 characters.')
    .transform((value) => stripControlCharacters(value, true))
    .optional()
    .or(z.literal('')),

  parkingInformation: z
    .string()
    .trim()
    .max(300, 'Please keep parking information under 300 characters.')
    .transform((value) => stripControlCharacters(value, true))
    .optional()
    .or(z.literal('')),

  importantMessage: z
    .string()
    .trim()
    .max(1000, 'Please keep this under 1000 characters.')
    .transform((value) => stripControlCharacters(value, true))
    .optional()
    .or(z.literal('')),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ---------------------------------------------------------------------------
// Step 3 — agreement
// ---------------------------------------------------------------------------

/**
 * There are deliberately NO consent-checkbox fields in the booking payload.
 *
 * Six mandatory tick-boxes were removed from the review step: three "I confirm"
 * declarations about the address, and three policy/contact permissions. They
 * added friction to every booking without adding protection, and their absence
 * cannot make a submission unsafe — nothing about them was a security control.
 *
 * The agreement itself has not gone away. The review step states, immediately
 * above the submit button, that submitting means agreeing to the Privacy Policy
 * and the Booking and Cancellation Policy and to being contacted about the
 * request, with links to both. That is a standard click-wrap: the act of
 * submitting IS the agreement, and it is recorded against the booking with a
 * timestamp — see `createBooking` in src/lib/bookings.ts.
 *
 * The security controls are untouched: honeypot, optional Turnstile, rate
 * limiting, idempotency key, server-side field validation and slot re-checking
 * all still run on every submission.
 */

// ---------------------------------------------------------------------------
// Full booking payload
// ---------------------------------------------------------------------------

export const bookingSchema = slotSchema
  .merge(customerSchema)
  .extend({
    /**
     * Honeypot. Real users never see or fill this field; bots usually do.
     * Any value at all means the submission is rejected silently.
     */
    website: z.string().max(0).optional().or(z.literal('')),

    /**
     * Client-generated idempotency key. Repeat submissions with the same key
     * return the original booking instead of creating a duplicate.
     */
    idempotencyKey: z
      .string()
      .trim()
      .min(8, 'Missing submission key. Please refresh the page and try again.')
      .max(64),

    /** Optional bot-protection token, only checked when Turnstile is configured. */
    captchaToken: z.string().max(2048).optional(),
  });

export type BookingInput = z.infer<typeof bookingSchema>;
/** Shape before Zod transforms — what the form fields actually hold. */
export type BookingFormValues = z.input<typeof bookingSchema>;

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name.')
    .max(120, 'Your name must be 120 characters or fewer.')
    .transform(collapseWhitespace),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .max(200)
    .email('Enter a valid email address.')
    .transform((value) => value.toLowerCase()),
  phoneNumber: optionalUkPhone,
  subject: z
    .string()
    .trim()
    .min(2, 'Choose or enter a subject.')
    .max(120)
    .transform(collapseWhitespace),
  message: z
    .string()
    .trim()
    .min(10, 'Please give us a little more detail so we can help.')
    .max(2000, 'Please keep your message under 2000 characters.')
    .transform((value) => stripControlCharacters(value, true)),
  consentContact: z
    .boolean()
    .refine((value) => value === true, 'Please confirm we may reply to your message.'),
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactFormValues = z.input<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminLoginSchema = z.object({
  email: z.string().trim().email('Enter your admin email address.'),
  password: z.string().min(12, 'Passwords must be at least 12 characters.'),
});

export const adminBookingActionSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(['confirm', 'cancel', 'complete', 'reschedule', 'note']),
  /** Reschedule only. */
  date: z.string().optional(),
  startTime: z.string().optional(),
  /** Note only. Internal staff commentary. */
  note: z.string().max(2000).optional(),
});

/** Convenience: price formatted from pence, e.g. 7500 → "£75.00". */
export function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: bookingConfig.currency,
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}
