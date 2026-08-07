import { bookingConfig, type WorkingDay } from '@/config/booking';

/**
 * Slot generation and availability rules.
 *
 * Every function here is pure and timezone-correct for the configured business
 * timezone (Europe/London), so the same maths runs identically in the browser,
 * on the server and in tests regardless of the host machine's locale.
 */

/**
 * Structural view of the booking rules.
 *
 * Every function here takes this shape rather than `typeof bookingConfig`, so
 * tests (and any future per-location override) can pass a modified rule set
 * without fighting the literal types of the frozen config object.
 */
export type BookingRules = {
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  slotGapMinutes: number;
  latestAppointmentMustEndByClosing: boolean;
  workingDays: readonly WorkingDay[];
  blockedDates: readonly string[];
  bookingHorizonDays: number;
  minimumNoticeHours: number;
  /** null = unlimited concurrent requests per slot. */
  maxBookingsPerSlot: number | null;
};

export type Slot = {
  /** Start time, "HH:mm" in business-local time. */
  start: string;
  /** End time, "HH:mm" in business-local time. */
  end: string;
  /** Human label, e.g. "08:00 – 08:45". */
  label: string;
};

export type SlotAvailability = Slot & {
  available: boolean;
  /**
   * Why the slot cannot be requested — shown to the user, never a bare "N/A".
   *
   * Note there is no "someone else booked this" reason. Several
   * physiotherapists can be sent out at the same time, so another patient's
   * request never removes a slot. `at-capacity` appears only when
   * `maxBookingsPerSlot` is set to a number and that number is reached.
   */
  unavailableReason?: 'at-capacity' | 'too-soon' | 'past';
};

/** Live request counts per start time, e.g. { "10:00": 3 }. */
export type SlotCounts = Readonly<Record<string, number>>;

const MINUTES_PER_DAY = 24 * 60;

/** "HH:mm" → minutes since midnight. Throws on malformed input. */
export function timeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) throw new Error(`Invalid time "${time}". Expected 24-hour "HH:mm".`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes since midnight → "HH:mm". */
export function minutesToTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes >= MINUTES_PER_DAY) {
    throw new Error(`Minutes out of range: ${minutes}`);
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Generates the full set of appointment slots for a working day, derived
 * entirely from `bookingConfig`. Never hard-code slot times anywhere else.
 */
export function generateSlots(config: BookingRules = bookingConfig): Slot[] {
  const opening = timeToMinutes(config.openingTime);
  const closing = timeToMinutes(config.closingTime);
  const duration = config.slotDurationMinutes;
  const step = duration + config.slotGapMinutes;

  if (duration <= 0) throw new Error('slotDurationMinutes must be greater than zero.');
  if (step <= 0) throw new Error('Slot step must be greater than zero.');
  if (closing <= opening) throw new Error('closingTime must be after openingTime.');

  const slots: Slot[] = [];
  for (let start = opening; start < closing; start += step) {
    const end = start + duration;

    // With the default rule an appointment may not finish after closing time,
    // so a 45-minute slot starting at 18:30 (ending 19:15) is not offered.
    if (config.latestAppointmentMustEndByClosing && end > closing) break;

    // Never generate a slot that would run past midnight.
    if (end >= MINUTES_PER_DAY) break;

    const startLabel = minutesToTime(start);
    const endLabel = minutesToTime(end);
    slots.push({ start: startLabel, end: endLabel, label: `${startLabel} – ${endLabel}` });
  }

  return slots;
}

/** All valid start times, e.g. ["08:00", "08:45", …]. */
export function getSlotStartTimes(config: BookingRules = bookingConfig): string[] {
  return generateSlots(config).map((slot) => slot.start);
}

export function isValidSlotStart(time: string, config: BookingRules = bookingConfig): boolean {
  return getSlotStartTimes(config).includes(time);
}

/** End time for a given start, or null when the start is not a valid slot. */
export function getSlotEnd(start: string, config: BookingRules = bookingConfig): string | null {
  return generateSlots(config).find((slot) => slot.start === start)?.end ?? null;
}

// ---------------------------------------------------------------------------
// Timezone-correct date helpers
// ---------------------------------------------------------------------------

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: bookingConfig.timeZone,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Offset in ms between the business timezone and UTC at a given instant. */
function zoneOffsetMs(instant: Date): number {
  const parts = partsFormatter.formatToParts(instant);
  const lookup: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') lookup[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    lookup.year ?? 1970,
    (lookup.month ?? 1) - 1,
    lookup.day ?? 1,
    (lookup.hour ?? 0) % 24,
    lookup.minute ?? 0,
    lookup.second ?? 0,
  );
  return asUtc - instant.getTime();
}

/**
 * Converts a business-local date and time ("2026-08-12", "14:45") to the exact
 * UTC instant, handling British Summer Time correctly. Two passes settle the
 * offset across DST boundaries.
 */
export function businessTimeToUtc(dateIso: string, time: string): Date {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) throw new Error(`Invalid date "${dateIso}".`);
  const minutes = timeToMinutes(time);

  const naive = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  const firstPass = naive - zoneOffsetMs(new Date(naive));
  const secondPass = naive - zoneOffsetMs(new Date(firstPass));
  return new Date(secondPass);
}

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: bookingConfig.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's date in the business timezone as "YYYY-MM-DD". */
export function todayInBusinessTz(now: Date = new Date()): string {
  return isoDateFormatter.format(now);
}

/** Day of week (0 = Sunday) for an ISO date, evaluated in the business timezone. */
export function dayOfWeek(dateIso: string): WorkingDay {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) throw new Error(`Invalid date "${dateIso}".`);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as WorkingDay;
}

/** Adds days to an ISO date string without timezone drift. */
export function addDays(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) throw new Error(`Invalid date "${dateIso}".`);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// ---------------------------------------------------------------------------
// Date availability
// ---------------------------------------------------------------------------

export type DateRejection =
  | 'invalid-format'
  | 'past'
  | 'beyond-horizon'
  | 'non-working-day'
  | 'blocked';

/** Returns null when the date is bookable, otherwise the reason it is not. */
export function checkDateBookable(
  dateIso: string,
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): DateRejection | null {
  if (!isIsoDate(dateIso)) return 'invalid-format';

  const today = todayInBusinessTz(now);
  if (dateIso < today) return 'past';
  if (dateIso > addDays(today, config.bookingHorizonDays)) return 'beyond-horizon';
  if (!config.workingDays.includes(dayOfWeek(dateIso))) return 'non-working-day';
  if ((config.blockedDates as readonly string[]).includes(dateIso)) return 'blocked';

  return null;
}

export function isDateBookable(
  dateIso: string,
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): boolean {
  return checkDateBookable(dateIso, now, config) === null;
}

/** Every bookable date within the configured horizon, in ascending order. */
export function getBookableDates(now: Date = new Date(), config: BookingRules = bookingConfig): string[] {
  const today = todayInBusinessTz(now);
  const dates: string[] = [];
  for (let offset = 0; offset <= config.bookingHorizonDays; offset += 1) {
    const date = addDays(today, offset);
    if (isDateBookable(date, now, config)) dates.push(date);
  }
  return dates;
}

/** The first bookable date, used to preselect the calendar. */
export function getFirstBookableDate(
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): string | null {
  return getBookableDates(now, config)[0] ?? null;
}

/**
 * Bookable dates that still have at least one slot satisfying the minimum
 * notice period.
 *
 * Today is a bookable date right up to closing time, but late in the day every
 * slot has passed. Offering it would show a calendar full of greyed-out times,
 * so those dates are filtered out before the form ever renders.
 */
export function getDatesWithAvailability(
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): string[] {
  return getBookableDates(now, config).filter((date) =>
    generateSlots(config).some((slot) => meetsMinimumNotice(date, slot.start, now, config)),
  );
}

/** The first date that actually has a selectable slot. */
export function getFirstDateWithAvailability(
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): string | null {
  return getDatesWithAvailability(now, config)[0] ?? null;
}

/**
 * True when a slot starts far enough in the future to satisfy the minimum
 * notice period. Also excludes slots that have already started today.
 */
export function meetsMinimumNotice(
  dateIso: string,
  start: string,
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): boolean {
  const slotStart = businessTimeToUtc(dateIso, start).getTime();
  const earliest = now.getTime() + config.minimumNoticeHours * 60 * 60 * 1000;
  return slotStart >= earliest;
}

/**
 * Full availability for one date: every configured slot, marked selectable or
 * with a specific reason it cannot be selected.
 *
 * Existing requests do NOT remove a slot. Several physiotherapists can be sent
 * out simultaneously, so the same time is offered to as many patients as
 * `maxBookingsPerSlot` allows — and when that is `null` (the current setting),
 * `counts` is ignored entirely.
 *
 * @param counts live request counts per start time, only consulted when a
 *               capacity limit is configured
 */
export function getSlotAvailability(
  dateIso: string,
  counts: SlotCounts = {},
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): SlotAvailability[] {
  const capacity = config.maxBookingsPerSlot;

  return generateSlots(config).map((slot) => {
    if (capacity !== null && (counts[slot.start] ?? 0) >= capacity) {
      return { ...slot, available: false, unavailableReason: 'at-capacity' as const };
    }
    if (!meetsMinimumNotice(dateIso, slot.start, now, config)) {
      const hasStarted = businessTimeToUtc(dateIso, slot.start).getTime() <= now.getTime();
      return {
        ...slot,
        available: false,
        unavailableReason: hasStarted ? ('past' as const) : ('too-soon' as const),
      };
    }
    return { ...slot, available: true };
  });
}

/** Server-side gate. Returns null when bookable, otherwise a reason code. */
export type SlotRejection = DateRejection | 'invalid-slot' | 'too-soon';

export function checkSlotBookable(
  dateIso: string,
  start: string,
  now: Date = new Date(),
  config: BookingRules = bookingConfig,
): SlotRejection | null {
  const dateProblem = checkDateBookable(dateIso, now, config);
  if (dateProblem) return dateProblem;
  if (!isValidSlotStart(start, config)) return 'invalid-slot';
  if (!meetsMinimumNotice(dateIso, start, now, config)) return 'too-soon';
  return null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** "Wednesday 12 August 2026" from "2026-08-12". */
export function formatLongDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) return dateIso;
  return longDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

/** "Wed 12 Aug" from "2026-08-12". */
export function formatShortDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) return dateIso;
  return shortDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

/** "08:00 – 08:45" for a start time. */
export function formatSlotRange(start: string, config: BookingRules = bookingConfig): string {
  const end = getSlotEnd(start, config);
  return end ? `${start} – ${end}` : start;
}

