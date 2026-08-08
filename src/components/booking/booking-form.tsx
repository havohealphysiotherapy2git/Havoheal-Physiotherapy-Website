'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Lock,
  AlertTriangle,
  Phone,
} from 'lucide-react';

import { bookingSchema, toUkE164, type BookingFormValues } from '@/lib/validation';
import { PhoneField } from '@/components/ui/phone-field';
import { bookingConfig, priceLabel, travelCostStatement } from '@/config/booking';
import { formatLongDate, getSlotEnd } from '@/lib/slots';
import { siteConfig, telHref } from '@/config/site';
import { createIdempotencyKey, cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { submitBooking, fetchAvailability } from '@/app/actions/booking';

import { Button } from '@/components/ui/button';
import { ErrorSummary, TextAreaField, TextField } from '@/components/ui/field';
import { DatePicker } from '@/components/booking/date-picker';
import { SlotPicker, type SlotOption } from '@/components/booking/slot-picker';
import { MovementArcs } from '@/components/graphics/decor';

const DRAFT_KEY = 'havoheal:booking-draft:v1';

const STEPS = [
  { number: 1, title: 'Date and time', short: 'Date & time' },
  { number: 2, title: 'Your details and visit address', short: 'Your details' },
  { number: 3, title: 'Review and confirm', short: 'Review' },
] as const;

const STEP_FIELDS: Record<number, (keyof BookingFormValues)[]> = {
  1: ['date', 'startTime'],
  2: [
    'fullName',
    'phoneNumber',
    'email',
    'postcode',
    'address',
    'addressFlat',
    'addressBuilding',
    'accessInstructions',
    'parkingInformation',
    'importantMessage',
  ],
  // Step 3 is review-only: nothing on it needs validating, because agreement is
  // given by submitting rather than by ticking boxes.
  3: [],
};

const FIELD_LABELS: Record<string, string> = {
  date: 'Preferred home-visit date',
  startTime: 'Home-visit time',
  fullName: 'Full name',
  phoneNumber: 'Phone number',
  email: 'Email address',
  postcode: 'Postcode for the appointment',
  address: 'Home-visit address',
  addressFlat: 'Flat or apartment number',
  addressBuilding: 'Building name',
  accessInstructions: 'Access instructions',
  parkingInformation: 'Parking information',
  importantMessage: 'Access instructions or important message',
};

export type BookingFormProps = {
  initialDate: string;
  minDate: string;
  maxDate: string;
  bookableDates: string[];
  fullyBookedDates: string[];
  initialSlots: SlotOption[];
  /** True when the availability service could not be reached at render time. */
  availabilityDegraded?: boolean;
};

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; title: string; message: string; canRetry: boolean };

export function BookingForm({
  initialDate,
  minDate,
  maxDate,
  bookableDates,
  fullyBookedDates,
  initialSlots,
  availabilityDegraded = false,
}: BookingFormProps) {
  const router = useRouter();

  const [step, setStep] = React.useState(1);
  const [slots, setSlots] = React.useState<SlotOption[]>(initialSlots);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [slotsMessage, setSlotsMessage] = React.useState<string | null>(
    availabilityDegraded
      ? 'We could not check live availability just now. You can still submit a request and we will confirm the time with you.'
      : null,
  );
  const [submitState, setSubmitState] = React.useState<SubmitState>({ kind: 'idle' });
  const [draftRestored, setDraftRestored] = React.useState(false);

  const summaryRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const liveRegionRef = React.useRef<HTMLDivElement>(null);
  // One key per form session. Kept stable across retries so a repeated submit
  // can never create a second booking.
  const idempotencyKey = React.useRef<string>(createIdempotencyKey());
  const firstRender = React.useRef(true);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      date: initialDate,
      startTime: '',
      fullName: '',
      phoneNumber: '',
      email: '',
      postcode: '',
      address: '',
      addressFlat: '',
      addressBuilding: '',
      accessInstructions: '',
      parkingInformation: '',
      importantMessage: '',
      website: '',
      idempotencyKey: idempotencyKey.current,
    },
  });

  const values = watch();

  // ---------------------------------------------------------------------
  // Draft persistence — a half-completed form survives an accidental
  // navigation, a refresh or a dropped connection.
  // ---------------------------------------------------------------------
  /** True when the visitor has actually typed something worth restoring. */
  const hasMeaningfulContent = React.useCallback(
    (draft: Partial<BookingFormValues>) =>
      Boolean(
        draft.fullName?.trim() ||
          draft.phoneNumber?.trim() ||
          draft.email?.trim() ||
          draft.postcode?.trim() ||
          draft.address?.trim() ||
          draft.importantMessage?.trim(),
      ),
    [],
  );

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { savedAt: number; values: Partial<BookingFormValues> };
      const ageMinutes = (Date.now() - parsed.savedAt) / 60000;
      if (ageMinutes > bookingConfig.formDraftTtlMinutes) {
        window.localStorage.removeItem(DRAFT_KEY);
        return;
      }

      const rest = parsed.values;

      // A saved date can go stale while the draft sits in storage — it may now
      // be in the past, fully booked, or a newly-closed day. Anything not in
      // the freshly-computed list is dropped, along with its time.
      const savedDate = typeof rest.date === 'string' ? rest.date : '';
      const dateIsStillOffered = savedDate !== '' && bookableDates.includes(savedDate);
      const restoredDate = dateIsStillOffered ? savedDate : initialDate;

      reset({
        ...getValues(),
        ...rest,
        date: restoredDate,
        // A time only makes sense with the date it was chosen for.
        startTime: dateIsStillOffered ? (rest.startTime ?? '') : '',
        idempotencyKey: idempotencyKey.current,
      });

      // Only tell the visitor something was restored when it actually was.
      if (hasMeaningfulContent(rest)) setDraftRestored(true);

      // The server rendered slots for `initialDate`; fetch the right ones if
      // the restored draft points somewhere else.
      if (restoredDate !== initialDate) void loadSlots(restoredDate);
    } catch {
      // A corrupt draft must never block the form.
      window.localStorage.removeItem(DRAFT_KEY);
    }
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      try {
        const rest = values;

        // Writing an empty draft would later trigger a misleading "we restored
        // your details" message, so only real content is persisted.
        if (!hasMeaningfulContent(rest) && !rest.startTime) {
          window.localStorage.removeItem(DRAFT_KEY);
          return;
        }

        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ savedAt: Date.now(), values: rest }),
        );
      } catch {
        // Storage may be full or blocked — the form still works without it.
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [values, hasMeaningfulContent]);

  // ---------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------
  const loadSlots = React.useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlotsMessage(null);
    try {
      const result = await fetchAvailability({ date });
      if (result.status === 'ok') {
        setSlots(result.slots);
      } else {
        setSlots([]);
        setSlotsMessage(result.message);
      }
    } catch {
      setSlots([]);
      setSlotsMessage(
        'We could not load available times. Check your connection and try again, or call us on ' +
          `${siteConfig.contact.phoneDisplay}.`,
      );
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const handleDateChange = React.useCallback(
    (date: string) => {
      setValue('date', date, { shouldValidate: true, shouldDirty: true });
      setValue('startTime', '', { shouldValidate: false });
      track('select_date');
      void loadSlots(date);
    },
    [loadSlots, setValue],
  );

  // ---------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------
  const announce = React.useCallback((message: string) => {
    if (liveRegionRef.current) liveRegionRef.current.textContent = message;
  }, []);

  const goToStep = React.useCallback(
    (next: number) => {
      setStep(next);
      const stepMeta = STEPS.find((item) => item.number === next);
      announce(`Step ${next} of ${STEPS.length}: ${stepMeta?.title ?? ''}`);
      // Focus the new step heading so keyboard and screen-reader users are
      // moved to the new content rather than left where the button was.
      window.setTimeout(() => headingRef.current?.focus(), 60);
    },
    [announce],
  );

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = await trigger(fields, { shouldFocus: true });
    if (!valid) {
      window.setTimeout(() => summaryRef.current?.focus(), 60);
      return;
    }
    track('complete_booking_step', { step });
    goToStep(Math.min(step + 1, STEPS.length));
  };

  const handleBack = () => goToStep(Math.max(step - 1, 1));

  // ---------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------
  const onSubmit = handleSubmit(async (formValues) => {
    setSubmitState({ kind: 'submitting' });
    track('submit_booking');

    try {
      const result = await submitBooking({
        ...formValues,
        idempotencyKey: idempotencyKey.current,
      });

      switch (result.status) {
        case 'success': {
          track('booking_success', { duplicate: result.duplicate });
          try {
            window.localStorage.removeItem(DRAFT_KEY);
          } catch {
            /* ignore */
          }
          router.push('/booking-confirmed');
          return;
        }

        // Only reachable when a per-slot limit is configured and reached. With
        // unlimited capacity another patient's request never blocks this one.
        case 'slot-at-capacity': {
          track('booking_failure', { reason: 'slot_at_capacity' });
          setSlots((current) =>
            current.map((slot) => ({
              ...slot,
              available: result.availableStarts.includes(slot.start),
              reason: result.availableStarts.includes(slot.start) ? undefined : 'at-capacity',
            })),
          );
          setValue('startTime', '', { shouldValidate: false });
          setSubmitState({
            kind: 'error',
            title: 'That time is fully booked',
            message: result.message,
            canRetry: false,
          });
          goToStep(1);
          void loadSlots(getValues('date'));
          return;
        }

        case 'validation-error': {
          track('booking_failure', { reason: 'validation' });
          let earliestStep: number = STEPS.length;
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof BookingFormValues, { type: 'server', message });
            const owningStep = Number(
              Object.entries(STEP_FIELDS).find(([, fields]) =>
                (fields as string[]).includes(field),
              )?.[0] ?? STEPS.length,
            );
            earliestStep = Math.min(earliestStep, owningStep);
          }
          setSubmitState({
            kind: 'error',
            title: 'Please check your details',
            message: result.message,
            canRetry: false,
          });
          goToStep(earliestStep);
          return;
        }

        case 'slot-invalid': {
          track('booking_failure', { reason: 'slot_invalid' });
          setSubmitState({
            kind: 'error',
            title: 'That appointment is no longer valid',
            message: result.message,
            canRetry: false,
          });
          goToStep(1);
          void loadSlots(getValues('date'));
          return;
        }

        case 'rate-limited': {
          track('booking_failure', { reason: 'rate_limited' });
          setSubmitState({
            kind: 'error',
            title: 'Too many requests',
            message: result.message,
            canRetry: false,
          });
          return;
        }

        case 'bot-suspected': {
          track('booking_failure', { reason: 'bot_check' });
          setSubmitState({
            kind: 'error',
            title: 'We could not process this submission',
            message: result.message,
            canRetry: false,
          });
          return;
        }

        default: {
          track('booking_failure', { reason: 'server' });
          setSubmitState({
            kind: 'error',
            title: 'Something went wrong at our end',
            message: result.message,
            canRetry: true,
          });
        }
      }
    } catch {
      // Network failure, offline, or the action never reached the server.
      track('booking_failure', { reason: 'network' });
      setSubmitState({
        kind: 'error',
        title: 'We could not reach our booking system',
        message:
          'Check your internet connection and try again. Your answers have been kept on this page. If it keeps happening, call us on ' +
          `${siteConfig.contact.phoneDisplay}.`,
        canRetry: true,
      });
    }
  });

  // Errors relevant to the visible step, for the error summary.
  const stepErrors = React.useMemo(() => {
    const fields = STEP_FIELDS[step] ?? [];
    return fields
      .filter((field) => errors[field])
      .map((field) => ({
        id: `booking-${field}`,
        message: `${FIELD_LABELS[field] ?? field}: ${errors[field]?.message ?? 'Please check this field.'}`,
      }));
  }, [errors, step]);

  const selectedEnd = values.startTime ? getSlotEnd(values.startTime) : null;
  const busy = isSubmitting || submitState.kind === 'submitting';

  /** The full visit address, assembled from its parts for the review step. */
  const fullAddress = [
    values.addressFlat?.trim(),
    values.addressBuilding?.trim(),
    values.address?.trim(),
    values.postcode?.trim(),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="relative">
      {/* Screen-reader announcements for step changes. */}
      <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-lift">
        {/* Progress header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-ocean-950 px-6 py-7 on-dark sm:px-9">
          <MovementArcs className="absolute -right-8 -top-10 h-52 w-52 opacity-25" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-300">
                Step {step} of {STEPS.length}
              </p>
              <p className="rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-white">
                {bookingConfig.slotDurationMinutes}-minute home visit — {priceLabel}
              </p>
            </div>

            <h2 className="mt-3 text-2xl text-white sm:text-3xl">
              {STEPS[step - 1]?.title}
            </h2>

            <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Booking progress">
              {STEPS.map((item) => {
                const state =
                  item.number < step ? 'done' : item.number === step ? 'current' : 'upcoming';
                return (
                  <li key={item.number} className="flex flex-col gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-1.5 rounded-full transition',
                        state === 'done'
                          ? 'bg-brand-300'
                          : state === 'current'
                            ? 'bg-white'
                            : 'bg-white/25',
                      )}
                    />
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium sm:text-sm',
                        state === 'upcoming' ? 'text-brand-200/70' : 'text-white',
                      )}
                    >
                      {state === 'done' && (
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {item.short}
                        <span className="sr-only">
                          {state === 'done'
                            ? ' — completed'
                            : state === 'current'
                              ? ' — current step'
                              : ' — not started'}
                        </span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="px-6 py-8 sm:px-9 sm:py-10">
          {/* Honeypot: positioned off-screen, hidden from assistive tech and
              excluded from the tab order. People never see or reach it. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor="booking-website">Leave this field empty</label>
            <input
              id="booking-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register('website')}
            />
          </div>
          <input type="hidden" {...register('idempotencyKey')} />

          <h3 ref={headingRef} tabIndex={-1} className="sr-only">
            Step {step} of {STEPS.length}: {STEPS[step - 1]?.title}
          </h3>

          {draftRestored && step === 1 && (
            <p className="mb-6 rounded-2xl border border-ocean-200 bg-ocean-50 p-4 text-sm text-ocean-900">
              We have restored the details you entered earlier. Please check them before
              submitting. Consent boxes are always left unticked.
            </p>
          )}

          {submitState.kind === 'error' && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border-2 border-coral-500 bg-coral-50 p-5"
            >
              <h4 className="flex items-center gap-2 text-base font-semibold text-coral-900">
                <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
                {submitState.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-coral-950">{submitState.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {submitState.canRetry && (
                  <Button size="sm" variant="secondary" onClick={() => void onSubmit()}>
                    Try submitting again
                  </Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <a href={telHref}>
                    <Phone aria-hidden="true" />
                    Call {siteConfig.contact.phoneDisplay}
                  </a>
                </Button>
              </div>
            </div>
          )}

          {stepErrors.length > 0 && (
            <ErrorSummary ref={summaryRef} errors={stepErrors} />
          )}

          {/* ---------------- Step 1 ---------------- */}
          {step === 1 && (
            <div className="space-y-8">
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <div id="booking-date-wrapper">
                    <DatePicker
                      id="booking-date"
                      value={field.value ?? ''}
                      onChange={handleDateChange}
                      bookableDates={bookableDates}
                      fullyBookedDates={fullyBookedDates}
                      minDate={minDate}
                      maxDate={maxDate}
                      error={errors.date?.message}
                    />
                  </div>
                )}
              />

              {slotsMessage && (
                <p className="rounded-2xl border border-sand-300 bg-sand-50 p-4 text-sm text-sand-900">
                  {slotsMessage}
                </p>
              )}

              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <div id="booking-startTime">
                    <SlotPicker
                      name="booking-startTime-input"
                      value={field.value ?? ''}
                      onChange={(start) => {
                        field.onChange(start);
                        track('select_time');
                      }}
                      slots={slots}
                      loading={slotsLoading}
                      error={errors.startTime?.message}
                    />
                  </div>
                )}
              />

              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
                <p className="text-lg font-semibold text-brand-900">
                  {bookingConfig.slotDurationMinutes}-minute home physiotherapy visit —{' '}
                  {priceLabel}
                </p>
                <p className="mt-1 text-sm text-brand-900/80">
                  One fixed price. Payment is arranged when we contact you — this website does
                  not take card details.
                </p>
              </div>
            </div>
          )}

          {/* ---------------- Step 2 ---------------- */}
          {step === 2 && (
            <div className="space-y-6">
              <TextField
                id="booking-fullName"
                label="Full name"
                required
                autoComplete="name"
                {...register('fullName')}
                error={errors.fullName?.message}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <PhoneField
                      id="booking-phone"
                      label="Phone number"
                      required
                      hint="So we can confirm your visit."
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      error={errors.phoneNumber?.message}
                    />
                  )}
                />
                <TextField
                  id="booking-email"
                  label="Email address"
                  type="email"
                  inputMode="email"
                  required
                  autoComplete="email"
                  hint="Your booking reference goes here."
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <fieldset className="space-y-6 rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-5">
                <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-brand-800">
                  Where should we come?
                </legend>

                <p className="text-sm leading-relaxed text-ink-soft">
                  This is the address the physiotherapist will travel to. Coverage is subject to
                  postcode availability, and we confirm it with you before the visit.
                </p>

                {/* Wide enough that "Postcode" and its hint stay on one line;
                    the address needs the remaining space. */}
                <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
                  <TextField
                    id="booking-postcode"
                    label="Postcode"
                    required
                    autoComplete="postal-code"
                    autoCapitalize="characters"
                    hint="So we can check we cover you."
                    {...register('postcode')}
                    error={errors.postcode?.message}
                  />
                  <TextField
                    id="booking-address"
                    label="Home-visit address"
                    required
                    autoComplete="street-address"
                    hint="House number or name and street."
                    {...register('address')}
                    error={errors.address?.message}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <TextField
                    id="booking-addressFlat"
                    label="Flat or apartment"
                    optionalLabel
                    maxLength={60}
                    hint="Saves us knocking on the wrong door."
                    {...register('addressFlat')}
                    error={errors.addressFlat?.message}
                  />
                  <TextField
                    id="booking-addressBuilding"
                    label="Building name"
                    optionalLabel
                    maxLength={120}
                    hint="If your building has one."
                    {...register('addressBuilding')}
                    error={errors.addressBuilding?.message}
                  />
                </div>

                <TextAreaField
                  id="booking-accessInstructions"
                  label="Access instructions"
                  optionalLabel
                  rows={3}
                  maxLength={500}
                  hint="Buzzer or intercom, a gate code, which entrance to use, stairs or a lift, or a dog we should know about."
                  {...register('accessInstructions')}
                  error={errors.accessInstructions?.message}
                />

                <TextAreaField
                  id="booking-parkingInformation"
                  label="Parking information"
                  optionalLabel
                  rows={2}
                  maxLength={300}
                  hint="Where the physiotherapist can park — a driveway, permit zone, or the nearest street that works."
                  {...register('parkingInformation')}
                  error={errors.parkingInformation?.message}
                />
              </fieldset>

              <TextAreaField
                id="booking-importantMessage"
                label="Important message for your appointment"
                optionalLabel
                rows={5}
                maxLength={1000}
                hint={
                  <>
                    Anything else practical we should know — for example the general area of the
                    body affected, or if someone will be with you.{' '}
                    <strong className="font-semibold text-coral-800">
                      Please do not send detailed medical histories, and never use this form to
                      report an emergency.
                    </strong>{' '}
                    Call 999 in an emergency or use NHS 111 when appropriate.
                  </>
                }
                {...register('importantMessage')}
                error={errors.importantMessage?.message}
              />
            </div>
          )}

          {/* ---------------- Step 3 ---------------- */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="rounded-2xl border-2 border-brand-300 bg-brand-50 p-5">
                <p className="text-lg font-semibold text-brand-900">
                  {bookingConfig.slotDurationMinutes}-minute home physiotherapy visit —{' '}
                  {priceLabel}
                </p>
                <p className="mt-1 text-sm text-brand-900/80">{travelCostStatement}</p>
              </div>

              <section aria-labelledby="review-heading">
                <h4 id="review-heading" className="text-lg font-semibold text-ink">
                  Check your home-visit request
                </h4>
                <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                  <ReviewRow
                    label="Home-visit date"
                    value={values.date ? formatLongDate(values.date) : '—'}
                  />
                  <ReviewRow
                    label="Time"
                    value={
                      values.startTime
                        ? `${values.startTime} – ${selectedEnd ?? ''}`
                        : '—'
                    }
                  />
                  <ReviewRow
                    label="Duration"
                    value={`${bookingConfig.slotDurationMinutes} minutes`}
                  />
                  <ReviewRow label="Price" value={`${priceLabel} fixed price`} />
                  <ReviewRow label="Appointment address" value={fullAddress || '—'} />
                  <ReviewRow label="Full name" value={values.fullName || '—'} />
                  <ReviewRow
                    label="Phone"
                    value={values.phoneNumber ? toUkE164(values.phoneNumber) : '—'}
                  />
                  <ReviewRow label="Email" value={values.email || '—'} />
                  <ReviewRow
                    label="Access instructions"
                    value={values.accessInstructions?.trim() || 'None provided'}
                  />
                  <ReviewRow
                    label="Parking"
                    value={values.parkingInformation?.trim() || 'None provided'}
                  />
                  <ReviewRow
                    label="Important message"
                    value={values.importantMessage?.trim() || 'None provided'}
                  />
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => goToStep(1)}>
                    Change date or time
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => goToStep(2)}>
                    Change your details or address
                  </Button>
                </div>
              </section>

              {/*
                The six mandatory tick-boxes that used to sit here have been
                replaced by this single notice. Submitting is the agreement —
                a standard click-wrap — and it is recorded against the booking
                with a timestamp. Both policies remain one tap away.
              */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-ink-soft">
                <p className="flex items-start gap-2">
                  <Lock className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <span>
                    Submitting this form creates a <strong>booking request</strong>. You will
                    receive an acknowledgement with a booking reference straight away. We then
                    check availability and postcode coverage, and contact you to confirm the visit
                    or offer an alternative time.
                  </span>
                </p>
                <p className="mt-3 pl-6">
                  By submitting, you agree to our{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    Privacy Policy
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/booking-and-cancellation-policy"
                    target="_blank"
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    Booking and Cancellation Policy
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>
                  , and to us contacting you by phone, WhatsApp or email about this request. We
                  only contact you about your appointment — we do not send marketing.
                </p>
              </div>
            </div>
          )}

          {/* ---------------- Navigation ---------------- */}
          <div className="mt-9 flex flex-col gap-3 border-t border-slate-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {step > 1 && (
                <Button variant="subtle" size="md" onClick={handleBack} disabled={busy}>
                  <ArrowLeft aria-hidden="true" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {step < STEPS.length ? (
                <Button size="lg" onClick={() => void handleNext()} disabled={busy}>
                  Next
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button type="submit" size="lg" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CalendarCheck aria-hidden="true" />
                      Submit Home-Visit Booking Request
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {busy && (
            <p role="status" className="mt-4 text-sm text-ink-muted">
              Sending your booking request. Please do not close this page or press submit again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 bg-white px-5 py-3.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="break-words text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
