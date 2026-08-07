'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { formatShortDate, formatLongDate } from '@/lib/slots';
import { cn } from '@/lib/utils';
import { FieldError, FieldHint, FieldLabel } from '@/components/ui/field';

/**
 * Date selection.
 *
 * Two routes to the same value, because neither alone serves everyone:
 *  - A native <input type="date">, which gives every platform its own fully
 *    accessible calendar (including screen-reader and mobile pickers) with
 *    min/max enforced by the browser.
 *  - A row of quick-pick buttons for the next few available dates, which is
 *    faster for the common case and does not require opening a calendar.
 *
 * Both write to the same form value, and unavailable dates are rejected either
 * way — the browser blocks them in the calendar, and the server re-checks.
 */
export function DatePicker({
  id,
  value,
  onChange,
  bookableDates,
  fullyBookedDates,
  minDate,
  maxDate,
  error,
  quickPickCount = 6,
}: {
  id: string;
  value: string;
  onChange: (date: string) => void;
  bookableDates: string[];
  fullyBookedDates: string[];
  minDate: string;
  maxDate: string;
  error?: string;
  quickPickCount?: number;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const fullSet = React.useMemo(() => new Set(fullyBookedDates), [fullyBookedDates]);

  const quickDates = React.useMemo(
    () => bookableDates.filter((date) => !fullSet.has(date)).slice(0, quickPickCount),
    [bookableDates, fullSet, quickPickCount],
  );

  const handleNativeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <FieldLabel htmlFor={id} required>
        Preferred home-visit date
      </FieldLabel>
      <FieldHint id={hintId}>
        We take requests seven days a week, from {formatShortDate(minDate)} to{' '}
        {formatShortDate(maxDate)}. Dates we are closed are not selectable.
      </FieldHint>

      {quickDates.length > 0 && (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink-soft">Soonest dates</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickDates.map((date) => {
              const selected = date === value;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onChange(date)}
                  aria-pressed={selected}
                  className={cn(
                    'tap-target rounded-xl border-2 px-4 py-2 text-sm font-semibold transition',
                    selected
                      ? 'border-brand-700 bg-brand-700 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-ink hover:border-brand-400 hover:bg-brand-50',
                  )}
                >
                  <span aria-hidden="true">{formatShortDate(date)}</span>
                  <span className="sr-only">{formatLongDate(date)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="relative mt-4 max-w-xs">
        <input
          id={id}
          type="date"
          value={value}
          min={minDate}
          max={maxDate}
          onChange={handleNativeChange}
          aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-required
          className={cn(
            'block min-h-[48px] w-full rounded-xl border-2 bg-white px-4 py-3 pr-11 text-ink shadow-sm transition',
            error
              ? 'border-coral-600'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-600',
          )}
        />
        <CalendarDays
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-brand-700"
          aria-hidden="true"
        />
      </div>

      {value && (
        <p className="mt-3 text-sm font-medium text-brand-900">
          Selected: {formatLongDate(value)}
        </p>
      )}

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
