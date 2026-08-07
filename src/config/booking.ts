/**
 * SINGLE SOURCE OF TRUTH for booking availability, pricing and duration.
 *
 * Every slot shown in the UI, validated on the server and stored in the
 * database is derived from this file. Nothing about availability is hard-coded
 * anywhere else — change it here and the whole application follows.
 */

export type WorkingDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday … 6 = Saturday

export const bookingConfig = {
  // ---------------------------------------------------------------------
  // Opening hours and slot generation
  // ---------------------------------------------------------------------

  /** First possible appointment START time, 24-hour "HH:mm". */
  openingTime: '08:00',

  /** Close of the working day, 24-hour "HH:mm". */
  closingTime: '19:00',

  /** Length of one appointment in minutes. */
  slotDurationMinutes: 45,

  /**
   * Gap between the end of one appointment and the start of the next, in
   * minutes. Set to 0 for back-to-back 45-minute slots starting at 08:00,
   * 08:45, 09:30 and so on.
   */
  slotGapMinutes: 0,

  /**
   * When true (the default and the safe interpretation), an appointment may not
   * finish after `closingTime`. With 45-minute slots starting at 08:00 this
   * makes 17:45–18:30 the final bookable slot, because an 18:30 start would end
   * at 19:15 — after closing.
   *
   * Set to false ONLY if the business owner confirms appointments may finish
   * after 19:00. That would make 18:30–19:15 the final slot.
   */
  latestAppointmentMustEndByClosing: true,

  // ---------------------------------------------------------------------
  // Working days
  // ---------------------------------------------------------------------

  /**
   * Days the business accepts appointment requests.
   * Currently all seven days, Sunday through Saturday.
   */
  workingDays: [0, 1, 2, 3, 4, 5, 6] as WorkingDay[],

  /**
   * Specific dates that are closed, "YYYY-MM-DD" (bank holidays, leave).
   * Add dates here to block them from the booking calendar immediately.
   */
  blockedDates: [] as string[],

  // ---------------------------------------------------------------------
  // Booking horizon and lead time
  // ---------------------------------------------------------------------

  /** How many days ahead customers may request an appointment. */
  bookingHorizonDays: 60,

  /**
   * Minimum notice in hours. A slot starting sooner than this is not offered,
   * so the team always has time to review a request and dispatch someone.
   *
   * This is a lead-time rule, not an occupancy rule — it is unrelated to how
   * many other patients have requested the same time. Set it to 0 to offer
   * every remaining slot today.
   */
  minimumNoticeHours: 4,

  // ---------------------------------------------------------------------
  // Capacity
  // ---------------------------------------------------------------------

  /**
   * How many patients may request the SAME date and start time.
   *
   * The business dispatches several physiotherapists, so one request does not
   * consume a time slot the way it would for a single-room clinic.
   *
   *   null → unlimited. Existing bookings never remove or disable a slot, and
   *          any number of patients may request the same time. This is the
   *          current setting.
   *   n    → at most n live bookings per slot. The (n+1)th request sees the
   *          slot as fully booked, in the UI and on the server.
   *
   * Set a number once demand approaches the number of physiotherapists who can
   * genuinely be sent out at once — an accepted request the business cannot
   * staff is worse than a slot that was never offered.
   */
  maxBookingsPerSlot: null as number | null,

  // ---------------------------------------------------------------------
  // Price
  // ---------------------------------------------------------------------

  /** Price in pence — integers avoid floating-point rounding errors. */
  priceInPence: 7500,
  currency: 'GBP',
  currencySymbol: '£',

  /**
   * Whether travel to the customer's address is included in the £75 price.
   *
   *   true  → the site states plainly that travel is included
   *   false → the site states that a travel charge may apply, and
   *           `travelChargeNote` must explain how it is calculated
   *   null  → NOT YET CONFIRMED. The site says only that travel costs are
   *           confirmed when we contact you, and makes no claim either way.
   *
   * PLACEHOLDER — the business owner must set this before launch. Leaving it
   * `null` is safe: nothing unsupported is published.
   */
  travelIncludedInPrice: null as boolean | null,

  /** Shown when `travelIncludedInPrice` is false. Ignored otherwise. */
  travelChargeNote: '',

  // ---------------------------------------------------------------------
  // Workflow
  // ---------------------------------------------------------------------

  /**
   * false  → submissions are saved as PENDING and a human confirms them.
   *          The customer sees an acknowledgement, not a confirmation.
   * true   → available slots are auto-confirmed on submission.
   *
   * Keep this false unless the business genuinely auto-confirms, otherwise the
   * site would imply a guarantee it cannot honour.
   */
  autoConfirmBookings: false,

  /** Timezone used for all slot maths. UK business, so Europe/London. */
  timeZone: 'Europe/London',

  /** How long an in-progress booking form is restored from local storage. */
  formDraftTtlMinutes: 90,
} as const;

/** Formatted price, e.g. "£75". Whole pounds render without decimals. */
export const priceLabel = (() => {
  const pounds = bookingConfig.priceInPence / 100;
  return `${bookingConfig.currencySymbol}${
    Number.isInteger(pounds) ? pounds.toString() : pounds.toFixed(2)
  }`;
})();

/** e.g. "45-minute appointment". */
export const durationLabel = `${bookingConfig.slotDurationMinutes}-minute appointment`;

/** e.g. "45-minute home visit". */
export const homeVisitLabel = `${bookingConfig.slotDurationMinutes}-minute home visit`;

/** e.g. "£75 — 45-minute home physiotherapy visit". */
export const priceAndDurationLabel = `${priceLabel} — ${bookingConfig.slotDurationMinutes}-minute home physiotherapy visit`;

/**
 * The single sentence used everywhere travel cost is mentioned, derived from
 * `travelIncludedInPrice` so no page can state something the business has not
 * confirmed.
 */
export const travelCostStatement = (() => {
  if (bookingConfig.travelIncludedInPrice === true) {
    return `Travel to your address within our service area is included in the ${priceLabel} price.`;
  }
  if (bookingConfig.travelIncludedInPrice === false) {
    return (
      bookingConfig.travelChargeNote ||
      'A travel charge may apply depending on your address. We confirm any additional cost with you before the appointment goes ahead.'
    );
  }
  return `The ${priceLabel} price covers the ${bookingConfig.slotDurationMinutes}-minute appointment itself. We confirm any travel arrangements and costs with you when we contact you about your booking request, before anything is agreed.`;
})();

export const bookingStatuses = [
  'PENDING',
  'CONFIRMED',
  'RESCHEDULED',
  'CANCELLED',
  'COMPLETED',
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export const bookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: 'Pending review',
  CONFIRMED: 'Confirmed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};
