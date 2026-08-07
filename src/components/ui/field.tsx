'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accessible form field primitives.
 *
 * Each field wires up: a real <label for>, hint and error text linked with
 * aria-describedby, aria-invalid on the control, and an error message that is
 * announced without stealing focus. Errors are never signalled by colour alone
 * — there is always an icon and text.
 */

type BaseFieldProps = {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Renders "Optional" instead of a required marker. */
  optionalLabel?: boolean;
};

function useFieldIds(id: string, hint?: React.ReactNode, error?: string) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { hintId, errorId, describedBy };
}

export function FieldLabel({
  htmlFor,
  children,
  required,
  optionalLabel,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  optionalLabel?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
      {children}
      {required && (
        <span className="ml-1 text-coral-700" aria-hidden="true">
          *
        </span>
      )}
      {optionalLabel && (
        <span className="ml-2 text-xs font-normal text-ink-muted">(optional)</span>
      )}
    </label>
  );
}

export function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-sm leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      className="mt-2 flex items-start gap-1.5 text-sm font-medium text-coral-800"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="sr-only">Error: </span>
        {children}
      </span>
    </p>
  );
}

/**
 * Fields flow top-down, so a control sits directly under its label and hint.
 *
 * Two fields side by side in a grid therefore align as long as their label and
 * hint occupy the same number of lines — which is why every field in a shared
 * row is given a hint, and hints are kept to one line.
 *
 * Bottom-aligning the control instead (`mt-auto`) looks equivalent but is not:
 * anything rendered BELOW an input — a validation error, or the phone field's
 * normalisation note — makes that column taller and drags its neighbour's input
 * down. Top alignment keeps inputs level and lets each column grow downwards
 * independently, which is also what people expect from a form.
 */
const fieldShellClasses = 'flex w-full flex-col';

const controlClasses = (hasError: boolean) =>
  cn(
    'block w-full rounded-xl border-2 bg-white px-4 py-3 text-ink shadow-sm transition placeholder:text-slate-400',
    'min-h-[48px]',
    hasError
      ? 'border-coral-600 focus:border-coral-700'
      : 'border-slate-300 hover:border-slate-400 focus:border-brand-600',
  );

export type TextFieldProps = BaseFieldProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'>;

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { id, label, hint, error, required, className, optionalLabel, ...props },
    ref,
  ) {
    const { hintId, errorId, describedBy } = useFieldIds(id, hint, error);
    return (
      <div className={cn(fieldShellClasses, className)}>
        <div className="mb-2">
          <FieldLabel htmlFor={id} required={required} optionalLabel={optionalLabel}>
            {label}
          </FieldLabel>
          {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
        </div>
        <input
          ref={ref}
          id={id}
          className={cn(controlClasses(Boolean(error)))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...props}
        />
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);

export type TextAreaFieldProps = BaseFieldProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'required'>;

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { id, label, hint, error, required, className, optionalLabel, rows = 5, ...props },
    ref,
  ) {
    const { hintId, errorId, describedBy } = useFieldIds(id, hint, error);
    return (
      <div className={cn(fieldShellClasses, className)}>
        <div className="mb-2">
          <FieldLabel htmlFor={id} required={required} optionalLabel={optionalLabel}>
            {label}
          </FieldLabel>
          {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
        </div>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={cn(controlClasses(Boolean(error)), 'resize-y leading-relaxed')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...props}
        />
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);

export type SelectFieldProps = BaseFieldProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'required'>;

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { id, label, hint, error, required, className, optionalLabel, children, ...props },
    ref,
  ) {
    const { hintId, errorId, describedBy } = useFieldIds(id, hint, error);
    return (
      <div className={cn(fieldShellClasses, className)}>
        <div className="mb-2">
          <FieldLabel htmlFor={id} required={required} optionalLabel={optionalLabel}>
            {label}
          </FieldLabel>
          {hint && hintId && <FieldHint id={hintId}>{hint}</FieldHint>}
        </div>
        <select
          ref={ref}
          id={id}
          className={cn(controlClasses(Boolean(error)), 'pr-10')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...props}
        >
          {children}
        </select>
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);

/**
 * Checkbox with an associated label. Uses a native input so keyboard and
 * screen-reader behaviour is the platform behaviour.
 */
export type CheckboxFieldProps = {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'>;

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ id, label, hint, error, className, ...props }, ref) {
    const { hintId, errorId, describedBy } = useFieldIds(id, hint, error);
    return (
      <div className={cn('w-full', className)}>
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border-2 p-4 transition',
            error ? 'border-coral-600 bg-coral-50/50' : 'border-slate-200 bg-white hover:border-brand-300',
          )}
        >
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="mt-0.5 size-6 shrink-0 cursor-pointer rounded-md border-2 border-slate-400 text-brand-700 accent-brand-700"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
          />
          <div className="min-w-0">
            <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ink">
              {label}
            </label>
            {hint && hintId && (
              <p id={hintId} className="mt-1 text-xs text-ink-muted">
                {hint}
              </p>
            )}
          </div>
        </div>
        {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);

/**
 * Error summary shown at the top of a step. Focused programmatically after a
 * failed submit so screen-reader and keyboard users land on the problem list.
 */
export const ErrorSummary = React.forwardRef<
  HTMLDivElement,
  { errors: { id: string; message: string }[]; title?: string }
>(function ErrorSummary({ errors, title = 'There is a problem' }, ref) {
  if (errors.length === 0) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="rounded-2xl border-2 border-coral-600 bg-coral-50 p-5"
    >
      <h3 id="error-summary-title" className="flex items-center gap-2 text-base text-coral-900">
        <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              className="font-medium text-coral-900 underline decoration-2 underline-offset-4 hover:text-coral-950"
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(error.id);
                target?.focus();
                target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
