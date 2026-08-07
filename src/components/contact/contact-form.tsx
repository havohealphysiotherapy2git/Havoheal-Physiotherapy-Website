'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, Loader2, Send } from 'lucide-react';

import { contactSchema, type ContactFormValues } from '@/lib/validation';
import { PhoneField } from '@/components/ui/phone-field';
import { submitContactMessage } from '@/app/actions/contact';
import { company, mailtoHref, telHref } from '@/config/site';
import { track } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import {
  CheckboxField,
  ErrorSummary,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui/field';

const SUBJECTS = [
  'Booking an appointment',
  'Checking whether you cover my area',
  'Changing or cancelling an appointment',
  'A question about pricing',
  'Something else',
];

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full name',
  email: 'Email address',
  phoneNumber: 'Phone number',
  subject: 'Subject',
  message: 'Message',
  consentContact: 'Permission to reply',
};

export function ContactForm() {
  const [result, setResult] = React.useState<
    { kind: 'success'; reference: string } | { kind: 'error'; message: string } | null
  >(null);
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const successRef = React.useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      subject: SUBJECTS[0],
      message: '',
      consentContact: false,
      website: '',
    },
  });

  const errorList = Object.entries(errors)
    .filter(([field]) => field in FIELD_LABELS)
    .map(([field, error]) => ({
      id: `contact-${field}`,
      message: `${FIELD_LABELS[field]}: ${error?.message ?? 'Please check this field.'}`,
    }));

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    try {
      const response = await submitContactMessage(values);

      if (response.status === 'success') {
        track('contact_form_submission');
        setResult({ kind: 'success', reference: response.reference });
        reset();
        window.setTimeout(() => successRef.current?.focus(), 60);
        return;
      }

      if (response.status === 'validation-error') {
        for (const [field, message] of Object.entries(response.fieldErrors)) {
          setError(field as keyof ContactFormValues, { type: 'server', message });
        }
        setResult({ kind: 'error', message: response.message });
      } else {
        setResult({ kind: 'error', message: response.message });
      }
      window.setTimeout(() => summaryRef.current?.focus(), 60);
    } catch {
      setResult({
        kind: 'error',
        message: `We could not send your message. Check your connection and try again, call us on ${company.phoneDisplay}, or email ${company.email} directly.`,
      });
      window.setTimeout(() => summaryRef.current?.focus(), 60);
    }
  });

  if (result?.kind === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-3xl border-2 border-brand-300 bg-brand-50 p-7"
      >
        <h2 className="flex items-center gap-2 text-2xl text-brand-900">
          <CheckCircle2 className="size-6 shrink-0" aria-hidden="true" />
          Thanks — your message has been sent
        </h2>
        <p className="mt-3 leading-relaxed text-brand-950">
          We have emailed you an acknowledgement. Your reference is{' '}
          <strong className="font-semibold">{result.reference}</strong>. We will reply as soon as
          we can.
        </p>
        <p className="mt-3 text-sm text-brand-950/80">
          If your enquiry is time sensitive, call or message us on{' '}
          <a href={telHref} className="font-semibold underline underline-offset-4">
            {company.phoneDisplay}
          </a>
          , or email{' '}
          <a href={mailtoHref} className="font-semibold underline underline-offset-4">
            {company.email}
          </a>
          .
        </p>
        <Button className="mt-5" variant="secondary" onClick={() => setResult(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {result?.kind === 'error' && (
        <div role="alert" className="rounded-2xl border-2 border-coral-500 bg-coral-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-coral-900">
            <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
            We could not send your message
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-coral-950">{result.message}</p>
        </div>
      )}

      {errorList.length > 0 && <ErrorSummary ref={summaryRef} errors={errorList} />}

      <TextField
        id="contact-fullName"
        label="Full name"
        required
        autoComplete="name"
        {...register('fullName')}
        error={errors.fullName?.message}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="contact-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          // Both fields in this row carry a one-line hint so their inputs sit
          // at the same height — see the note in field.tsx.
          hint="Where we will send our reply."
          {...register('email')}
          error={errors.email?.message}
        />
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <PhoneField
              id="contact-phone"
              label="Phone number"
              optionalLabel
              hint="If you would prefer a call back."
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              error={errors.phoneNumber?.message}
            />
          )}
        />
      </div>

      <SelectField
        id="contact-subject"
        label="Subject"
        required
        {...register('subject')}
        error={errors.subject?.message}
      >
        {SUBJECTS.map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        id="contact-message"
        label="Message"
        required
        rows={6}
        maxLength={2000}
        hint={
          <>
            Tell us how we can help.{' '}
            <strong className="font-semibold text-coral-800">
              Please do not include detailed medical information, and never use this form to
              report an emergency.
            </strong>{' '}
            Call 999 in an emergency or use NHS 111 when appropriate.
          </>
        }
        {...register('message')}
        error={errors.message?.message}
      />

      <CheckboxField
        id="contact-consentContact"
        label={`${company.legalName} may use my contact details to reply to this message.`}
        hint="We will only use them to respond to your enquiry. We do not send marketing."
        {...register('consentContact')}
        error={errors.consentContact?.message}
      />

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send aria-hidden="true" />
            Send message
          </>
        )}
      </Button>

      {isSubmitting && (
        <p role="status" className="text-sm text-ink-muted">
          Sending your message. Please do not close this page.
        </p>
      )}
    </form>
  );
}
