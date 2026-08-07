'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/field';

export type SlotOption = {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
};

/**
 * There is deliberately no "already booked" label. Another patient requesting
 * the same time never disables a slot — several physiotherapists can be sent
 * out at once. `at-capacity` appears only if a per-slot limit is configured and
 * reached.
 */
const reasonLabels: Record<string, string> = {
  'at-capacity': 'Fully booked',
  'too-soon': 'Too soon to request online',
  past: 'Time has passed',
};

/**
 * Appointment time selection.
 *
 * Implemented as a native radio group inside a fieldset with a legend. Radios
 * are visually restyled but never replaced, so arrow-key navigation, the
 * "group" role and the selected-state announcement all come from the platform.
 * Unavailable slots are disabled AND labelled with the reason — never conveyed
 * by colour alone.
 */
export function SlotPicker({
  name,
  value,
  onChange,
  slots,
  loading,
  error,
  emptyMessage,
}: {
  name: string;
  value: string;
  onChange: (start: string) => void;
  slots: SlotOption[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}) {
  const errorId = `${name}-error`;
  const availableCount = slots.filter((slot) => slot.available).length;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-sm font-semibold text-ink">
        Preferred 45-minute visit time
        <span className="ml-1 text-coral-700" aria-hidden="true">
          *
        </span>
      </legend>

      <p className="mt-1 text-sm text-ink-muted" role="status">
        {loading
          ? 'Loading times…'
          : availableCount > 0
            ? `${availableCount} start ${availableCount === 1 ? 'time' : 'times'} to choose from on this date. We confirm your visit after you submit.`
            : (emptyMessage ??
              'No start times remain on this date. Please choose another date.')}
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-ink-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span>Loading times…</span>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((slot) => {
            const selected = value === slot.start;
            const inputId = `${name}-${slot.start.replace(':', '')}`;
            const reason = slot.reason ? reasonLabels[slot.reason] : undefined;

            return (
              <div key={slot.start} className="relative">
                <input
                  type="radio"
                  id={inputId}
                  name={name}
                  value={slot.start}
                  checked={selected}
                  disabled={!slot.available}
                  onChange={() => onChange(slot.start)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={inputId}
                  className={cn(
                    'flex min-h-[64px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 text-center transition',
                    'peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-900',
                    slot.available
                      ? selected
                        ? 'border-brand-700 bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-glow'
                        : 'border-slate-300 bg-white text-ink hover:border-brand-400 hover:bg-brand-50'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500',
                  )}
                >
                  <span className="text-base font-semibold tabular-nums">{slot.start}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      selected ? 'text-brand-100' : 'text-ink-muted',
                    )}
                  >
                    to {slot.end}
                  </span>
                  {!slot.available && reason && (
                    <span className="mt-0.5 text-[0.68rem] font-medium uppercase tracking-wide text-slate-600">
                      {reason}
                    </span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      )}

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
