'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { phoneDigits, toUkE164, toUkNationalNumber, UK_DIAL_CODE } from '@/lib/validation';
import { FieldError, FieldHint, FieldLabel } from '@/components/ui/field';

/**
 * UK phone entry with a fixed "🇬🇧 +44" prefix.
 *
 * The service area is Birmingham, so there is no country to choose. Fixing the
 * prefix removes the most common source of malformed numbers: the customer
 * types only the national part, and a leading zero is handled for them.
 *
 * Accessibility notes:
 *  - The prefix is presentational: the flag emoji and the visible "+44" are
 *    hidden from assistive technology, and the same information is given to
 *    screen readers once, in the field's description. Otherwise the emoji is
 *    announced as "flag of the United Kingdom" mid-field, which is noise.
 *  - The prefix is not focusable, not clickable and carries no interaction, so
 *    there is nothing for a keyboard user to tab through before the input.
 *  - Errors are signalled with an icon and text, never colour alone.
 */
export type PhoneFieldProps = {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  optionalLabel?: boolean;
  className?: string;

  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
};

export const PhoneField = React.forwardRef<HTMLInputElement, PhoneFieldProps>(
  function PhoneField(
    {
      id,
      label,
      hint,
      error,
      required,
      optionalLabel,
      className,
      value,
      onChange,
      onBlur,
      name,
      placeholder = '7123 456789',
    },
    ref,
  ) {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const prefixId = `${id}-prefix`;
    // The prefix description comes first so the country code is announced
    // before any hint text.
    const describedBy = [prefixId, hintId, errorId].filter(Boolean).join(' ');

    const hasError = Boolean(error);

    const typedDigits = phoneDigits(value);
    const normalised = toUkE164(value);
    // True when the customer typed something the prefix would otherwise appear
    // to duplicate — a trunk zero, or a country code they added themselves.
    const needsNormalising =
      typedDigits.length > 0 && typedDigits !== toUkNationalNumber(value);

    return (
      // Top-down flow, matching the primitives in field.tsx: the control sits
      // directly under the label and hint, so it stays level with a neighbouring
      // field even when the normalisation note below makes this column taller.
      <div className={cn('flex w-full flex-col', className)}>
        <div className="mb-2">
          <FieldLabel htmlFor={id} required={required} optionalLabel={optionalLabel}>
            {label}
          </FieldLabel>
          {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
        </div>

        <div
          className={cn(
            'flex items-stretch overflow-hidden rounded-xl border-2 bg-white shadow-sm transition',
            // The ring is drawn on the wrapper so the prefix and the input read
            // as a single field.
            'focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-brand-900',
            hasError
              ? 'border-coral-600'
              : 'border-slate-300 hover:border-slate-400 focus-within:border-brand-600',
          )}
        >
          {/*
            Fixed prefix. `pointer-events-none` guarantees it can never be
            clicked, and aria-hidden keeps it out of the accessibility tree —
            the same information is provided by the visually hidden description
            below, which is referenced by the input.
          */}
          <span
            aria-hidden="true"
            className="pointer-events-none flex select-none items-center gap-2 border-r-2 border-slate-200 bg-slate-50 px-3 text-ink"
          >
            <span className="text-lg leading-none">🇬🇧</span>
            <span className="font-semibold tabular-nums">{UK_DIAL_CODE}</span>
          </span>

          <input
            ref={ref}
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            aria-describedby={describedBy}
            aria-invalid={hasError ? true : undefined}
            aria-required={required || undefined}
            className="min-h-[48px] w-full border-0 px-4 py-3 text-ink placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <span id={prefixId} className="sr-only">
          United Kingdom country code {UK_DIAL_CODE}. Enter the rest of your number.
        </span>

        {/*
          Shown only when what was typed differs from what will be saved —
          which in practice means a habitual leading zero, or a pasted "+44".
          Without this the field reads "+44  07123 456789", which looks exactly
          like the malformed number we are avoiding. Silent on the happy path.
        */}
        {!error && needsNormalising && (
          <p className="mt-1.5 text-sm text-ink-muted">
            We will save this as{' '}
            <span className="font-medium text-ink tabular-nums">{normalised}</span>
          </p>
        )}

        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);
