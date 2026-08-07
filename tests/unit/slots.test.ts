import { describe, expect, it } from 'vitest';

import {
  addDays,
  businessTimeToUtc,
  checkDateBookable,
  checkSlotBookable,
  generateSlots,
  getBookableDates,
  getDatesWithAvailability,
  getFirstDateWithAvailability,
  getSlotAvailability,
  getSlotEnd,
  getSlotStartTimes,
  isIsoDate,
  isValidSlotStart,
  meetsMinimumNotice,
  minutesToTime,
  timeToMinutes,
} from '@/lib/slots';
import { bookingConfig } from '@/config/booking';

describe('time helpers', () => {
  it('converts between "HH:mm" and minutes', () => {
    expect(timeToMinutes('08:00')).toBe(480);
    expect(timeToMinutes('18:30')).toBe(1110);
    expect(minutesToTime(480)).toBe('08:00');
    expect(minutesToTime(1110)).toBe('18:30');
  });

  it('rejects malformed times', () => {
    expect(() => timeToMinutes('8:00')).toThrow();
    expect(() => timeToMinutes('24:00')).toThrow();
    expect(() => timeToMinutes('08:60')).toThrow();
  });
});

describe('generateSlots', () => {
  it('starts at the configured opening time', () => {
    expect(generateSlots()[0]).toEqual({
      start: '08:00',
      end: '08:45',
      label: '08:00 – 08:45',
    });
  });

  it('steps by the slot duration', () => {
    const starts = getSlotStartTimes();
    expect(starts.slice(0, 6)).toEqual([
      '08:00',
      '08:45',
      '09:30',
      '10:15',
      '11:00',
      '11:45',
    ]);
  });

  it('does not offer a slot that would finish after closing time', () => {
    // 18:30 + 45 minutes = 19:15, which is after the 19:00 close, so the last
    // bookable slot is 17:45–18:30.
    const slots = generateSlots();
    const last = slots[slots.length - 1];
    expect(last).toEqual({ start: '17:45', end: '18:30', label: '17:45 – 18:30' });
    expect(getSlotStartTimes()).not.toContain('18:30');
  });

  it('offers the 18:30 slot when appointments may finish after closing', () => {
    const slots = generateSlots({
      ...bookingConfig,
      latestAppointmentMustEndByClosing: false,
    });
    const last = slots[slots.length - 1];
    expect(last?.start).toBe('18:30');
    expect(last?.end).toBe('19:15');
  });

  it('honours a configured gap between appointments', () => {
    const starts = generateSlots({ ...bookingConfig, slotGapMinutes: 15 }).map((s) => s.start);
    expect(starts.slice(0, 3)).toEqual(['08:00', '09:00', '10:00']);
  });

  it('validates slot start times', () => {
    expect(isValidSlotStart('08:00')).toBe(true);
    expect(isValidSlotStart('08:30')).toBe(false);
    expect(isValidSlotStart('18:30')).toBe(false);
    expect(getSlotEnd('14:00')).toBe('14:45');
    expect(getSlotEnd('08:30')).toBeNull();
  });
});

describe('date helpers', () => {
  it('validates ISO dates', () => {
    expect(isIsoDate('2026-08-12')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('12/08/2026')).toBe(false);
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('converts business-local times to the correct UTC instant', () => {
    // British Summer Time: London is UTC+1 in August.
    expect(businessTimeToUtc('2026-08-12', '14:00').toISOString()).toBe(
      '2026-08-12T13:00:00.000Z',
    );
    // Greenwich Mean Time: London is UTC in January.
    expect(businessTimeToUtc('2026-01-14', '14:00').toISOString()).toBe(
      '2026-01-14T14:00:00.000Z',
    );
  });
});

describe('date availability rules', () => {
  // A Wednesday, mid-morning.
  const now = new Date('2026-08-12T09:00:00Z');

  it('rejects dates in the past', () => {
    expect(checkDateBookable('2026-08-11', now)).toBe('past');
  });

  it('rejects dates beyond the booking horizon', () => {
    const beyond = addDays('2026-08-12', bookingConfig.bookingHorizonDays + 1);
    expect(checkDateBookable(beyond, now)).toBe('beyond-horizon');
  });

  it('rejects a day the business does not work', () => {
    // All seven days are open by default, so this needs an explicit rule set.
    const weekdaysOnly = { ...bookingConfig, workingDays: [1, 2, 3, 4, 5] as const };
    // 2026-08-16 is a Sunday.
    expect(checkDateBookable('2026-08-16', now, weekdaysOnly)).toBe('non-working-day');
  });

  it('rejects blocked dates', () => {
    const config = { ...bookingConfig, blockedDates: ['2026-08-13'] };
    expect(checkDateBookable('2026-08-13', now, config)).toBe('blocked');
  });

  it('accepts a valid working day', () => {
    expect(checkDateBookable('2026-08-13', now)).toBeNull();
  });
});

describe('minimum notice', () => {
  const now = new Date('2026-08-12T09:00:00Z'); // 10:00 London time

  it('rejects a slot inside the notice period', () => {
    // 11:00 London is only one hour away; the default notice is four hours.
    expect(meetsMinimumNotice('2026-08-12', '11:00', now)).toBe(false);
  });

  it('accepts a slot beyond the notice period', () => {
    expect(meetsMinimumNotice('2026-08-12', '15:30', now)).toBe(true);
  });

  it('accepts any slot on a later date', () => {
    expect(meetsMinimumNotice('2026-08-13', '08:00', now)).toBe(true);
  });
});

describe('getSlotAvailability', () => {
  const now = new Date('2026-08-12T09:00:00Z');

  it('keeps a slot selectable no matter how many people have requested it', () => {
    // The core of the capacity model: existing requests never remove a slot.
    const availability = getSlotAvailability('2026-08-13', { '10:15': 25 }, now);
    const busy = availability.find((slot) => slot.start === '10:15');
    expect(busy?.available).toBe(true);
    expect(busy?.unavailableReason).toBeUndefined();
  });

  it('marks slots that have already started as past', () => {
    const availability = getSlotAvailability('2026-08-12', {}, now);
    const past = availability.find((slot) => slot.start === '08:00');
    expect(past?.available).toBe(false);
    expect(past?.unavailableReason).toBe('past');
  });

  it('marks slots inside the notice window as too soon', () => {
    const availability = getSlotAvailability('2026-08-12', {}, now);
    const soon = availability.find((slot) => slot.start === '11:00');
    expect(soon?.available).toBe(false);
    expect(soon?.unavailableReason).toBe('too-soon');
  });

  it('leaves later slots available', () => {
    const availability = getSlotAvailability('2026-08-13', {}, now);
    expect(availability.every((slot) => slot.available)).toBe(true);
  });
});

describe('capacity limits', () => {
  const now = new Date('2026-08-12T09:00:00Z');
  const capped = { ...bookingConfig, maxBookingsPerSlot: 3 };

  it('keeps a slot selectable below the configured limit', () => {
    const availability = getSlotAvailability('2026-08-13', { '10:15': 2 }, now, capped);
    expect(availability.find((slot) => slot.start === '10:15')?.available).toBe(true);
  });

  it('closes a slot once the limit is reached', () => {
    const availability = getSlotAvailability('2026-08-13', { '10:15': 3 }, now, capped);
    const full = availability.find((slot) => slot.start === '10:15');
    expect(full?.available).toBe(false);
    expect(full?.unavailableReason).toBe('at-capacity');
  });

  it('does not affect other slots on the same date', () => {
    const availability = getSlotAvailability('2026-08-13', { '10:15': 3 }, now, capped);
    expect(availability.find((slot) => slot.start === '11:00')?.available).toBe(true);
  });
});

describe('seven-day availability', () => {
  it('accepts every day of the week', () => {
    expect(bookingConfig.workingDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('offers Sunday, which used to be closed', () => {
    const now = new Date('2026-08-12T09:00:00Z');
    // 2026-08-16 is a Sunday.
    expect(checkDateBookable('2026-08-16', now)).toBeNull();
    expect(getDatesWithAvailability(now)).toContain('2026-08-16');
  });

  it('still refuses a date the business has closed', () => {
    const now = new Date('2026-08-12T09:00:00Z');
    const closed = { ...bookingConfig, blockedDates: ['2026-08-16'] };
    expect(checkDateBookable('2026-08-16', now, closed)).toBe('blocked');
    expect(checkSlotBookable('2026-08-16', '10:15', now, closed)).toBe('blocked');
  });

  it('still refuses times outside opening hours', () => {
    const now = new Date('2026-08-12T09:00:00Z');
    expect(checkSlotBookable('2026-08-13', '07:00', now)).toBe('invalid-slot');
    expect(checkSlotBookable('2026-08-13', '20:00', now)).toBe('invalid-slot');
  });
});

describe('dates offered in the booking form', () => {
  it('drops today once every slot has passed or is too soon', () => {
    // 18:00 London time on a Wednesday: 17:45 is inside the four-hour notice
    // window, so no slot remains today.
    const lateInTheDay = new Date('2026-08-12T17:00:00Z');

    expect(getBookableDates(lateInTheDay)).toContain('2026-08-12');
    expect(getDatesWithAvailability(lateInTheDay)).not.toContain('2026-08-12');
    expect(getFirstDateWithAvailability(lateInTheDay)).toBe('2026-08-13');
  });

  it('keeps today when slots are still selectable', () => {
    // 08:00 London time: the afternoon is still open.
    const earlyMorning = new Date('2026-08-12T07:00:00Z');
    expect(getDatesWithAvailability(earlyMorning)).toContain('2026-08-12');
    expect(getFirstDateWithAvailability(earlyMorning)).toBe('2026-08-12');
  });

  it('never offers a day the business does not work', () => {
    const now = new Date('2026-08-12T09:00:00Z');
    const weekdaysOnly = { ...bookingConfig, workingDays: [1, 2, 3, 4, 5] as const };
    // 2026-08-16 is a Sunday.
    expect(getDatesWithAvailability(now, weekdaysOnly)).not.toContain('2026-08-16');
  });
});

describe('checkSlotBookable', () => {
  const now = new Date('2026-08-12T09:00:00Z');

  it('accepts a valid future slot', () => {
    expect(checkSlotBookable('2026-08-13', '10:15', now)).toBeNull();
  });

  it('rejects a start time that is not a configured slot', () => {
    expect(checkSlotBookable('2026-08-13', '10:20', now)).toBe('invalid-slot');
  });

  it('rejects the 18:30 start under the default closing rule', () => {
    expect(checkSlotBookable('2026-08-13', '18:30', now)).toBe('invalid-slot');
  });

  it('rejects a slot inside the notice window', () => {
    expect(checkSlotBookable('2026-08-12', '11:00', now)).toBe('too-soon');
  });
});
