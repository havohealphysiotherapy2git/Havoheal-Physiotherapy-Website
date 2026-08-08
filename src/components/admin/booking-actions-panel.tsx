'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, CalendarClock, StickyNote, CheckCheck, Loader2 } from 'lucide-react';

import { updateBooking, type AdminActionResult } from '@/app/actions/admin';
import { bookingStatusLabels, type BookingStatus } from '@/config/booking';
import { Button } from '@/components/ui/button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/field';

/**
 * Administrative actions for one booking.
 *
 * Every action posts to a server action that re-checks the admin session and
 * re-validates the payload, so nothing here is trusted. Destructive actions ask
 * for confirmation first.
 */
export function BookingActionsPanel({
  bookingId,
  status,
  currentDate,
  currentStartTime,
  staffNotes,
  slotStarts,
  bookableDates,
}: {
  bookingId: string;
  status: BookingStatus;
  currentDate: string;
  currentStartTime: string;
  staffNotes: string;
  slotStarts: string[];
  bookableDates: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AdminActionResult | null>(null);

  const [date, setDate] = React.useState(currentDate);
  const [startTime, setStartTime] = React.useState(currentStartTime);
  const [note, setNote] = React.useState(staffNotes);

  const run = async (action: string, extra: Record<string, string> = {}) => {
    setPending(action);
    setResult(null);
    try {
      const response = await updateBooking({ bookingId, action, ...extra });
      setResult(response);
      if (response.ok) router.refresh();
    } catch {
      setResult({ ok: false, message: 'That change could not be saved. Please try again.' });
    } finally {
      setPending(null);
    }
  };

  const confirmThen = (message: string, action: () => void) => {
    if (window.confirm(message)) action();
  };

  const minDate = bookableDates[0] ?? currentDate;
  const maxDate = bookableDates[bookableDates.length - 1] ?? currentDate;

  return (
    <div className="sticky top-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-xl">Actions</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Current status: {bookingStatusLabels[status]}
        </p>
      </div>

      {result && (
        <div
          role="status"
          className={`rounded-xl border-2 p-3 text-sm ${
            !result.ok
              ? 'border-coral-500 bg-coral-50 text-coral-900'
              : // Amber when the change saved but the patient was not emailed:
                // green would imply the patient has been told, and they have not.
                result.tone === 'warning'
                ? 'border-sand-400 bg-sand-50 text-sand-900'
                : 'border-brand-300 bg-brand-50 text-brand-900'
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="space-y-2">
        <Button
          block
          size="md"
          disabled={pending !== null || status === 'CONFIRMED'}
          onClick={() => void run('confirm')}
        >
          {pending === 'confirm' ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          Confirm booking
        </Button>

        <Button
          block
          size="md"
          variant="secondary"
          disabled={pending !== null || status === 'COMPLETED'}
          onClick={() => void run('complete')}
        >
          {pending === 'complete' ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckCheck aria-hidden="true" />
          )}
          Mark complete
        </Button>

        <Button
          block
          size="md"
          variant="destructive"
          disabled={pending !== null || status === 'CANCELLED'}
          onClick={() =>
            confirmThen(
              'Cancel this booking? The slot will be released for someone else. Remember to tell the customer.',
              () => void run('cancel'),
            )
          }
        >
          {pending === 'cancel' ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <X aria-hidden="true" />
          )}
          Cancel booking
        </Button>
      </div>

      <section className="border-t border-slate-200 pt-5">
        <h3 className="text-base font-semibold text-ink">Reschedule</h3>
        <div className="mt-3 space-y-3">
          <TextField
            id="reschedule-date"
            label="New date"
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(event) => setDate(event.target.value)}
          />
          <SelectField
            id="reschedule-time"
            label="New start time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          >
            {slotStarts.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </SelectField>
          <Button
            block
            size="md"
            variant="secondary"
            disabled={pending !== null}
            onClick={() =>
              confirmThen('Move this appointment to the new date and time?', () =>
                void run('reschedule', { date, startTime }),
              )
            }
          >
            {pending === 'reschedule' ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <CalendarClock aria-hidden="true" />
            )}
            Reschedule
          </Button>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-5">
        <h3 className="text-base font-semibold text-ink">Internal note</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Staff only. Kept separate from anything the customer wrote, and never shown to them.
        </p>
        <div className="mt-3 space-y-3">
          <TextAreaField
            id="staff-note"
            label="Note"
            rows={4}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button
            block
            size="md"
            variant="subtle"
            disabled={pending !== null}
            onClick={() => void run('note', { note })}
          >
            {pending === 'note' ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <StickyNote aria-hidden="true" />
            )}
            Save note
          </Button>
        </div>
      </section>
    </div>
  );
}
