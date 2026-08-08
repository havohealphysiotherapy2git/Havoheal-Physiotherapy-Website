import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { formatLongDate, generateSlots, getBookableDates } from '@/lib/slots';
import { formatPrice } from '@/lib/validation';
import { StatusBadge } from '@/components/admin/status-badge';
import { BookingActionsPanel } from '@/components/admin/booking-actions-panel';

export const dynamic = 'force-dynamic';

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: 'desc' } } },
  });

  if (!booking) notFound();

  const slots = generateSlots();
  const bookableDates = getBookableDates();

  return (
    <div className="container py-8">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to all bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl">{booking.reference}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl">Appointment</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Date" value={formatLongDate(booking.date)} />
              <Detail label="Time" value={`${booking.startTime} – ${booking.endTime}`} />
              <Detail label="Duration" value={`${booking.durationMinutes} minutes`} />
              <Detail label="Price" value={formatPrice(booking.priceInPence)} />
              {booking.rescheduledFrom && (
                <Detail label="Moved from" value={booking.rescheduledFrom} />
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl">Customer</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Name" value={booking.fullName} />
              <Detail
                label="Phone"
                value={booking.phone}
                href={`tel:${booking.phone}`}
              />
              <Detail
                label="Email"
                value={booking.email}
                href={`mailto:${booking.email}`}
              />
              <Detail label="Postcode" value={booking.postcode} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl">Visit address</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {booking.addressFlat && (
                <Detail label="Flat / apartment" value={booking.addressFlat} />
              )}
              {booking.addressBuilding && (
                <Detail label="Building" value={booking.addressBuilding} />
              )}
              <Detail label="Address" value={booking.address} className="sm:col-span-2" />
              <Detail label="Postcode" value={booking.postcode} />
              <Detail
                label="Parking"
                value={booking.parkingInformation?.trim() || 'Not provided'}
              />
              <Detail
                label="Access instructions"
                value={booking.accessInstructions?.trim() || 'Not provided'}
                className="sm:col-span-2"
              />
            </dl>

            {/*
              These three declarations are no longer asked for at booking time,
              so "false" means "not collected" rather than "the customer said
              no". Bookings taken while the tick-boxes existed still show Yes.
            */}
            <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3">
              <Detail
                label="Confirmed in service area"
                value={booking.confirmedServiceArea ? 'Yes' : 'Not asked'}
              />
              <Detail
                label="Confirmed address accurate"
                value={booking.confirmedAddressAccurate ? 'Yes' : 'Not asked'}
              />
              <Detail
                label="Understood request, not booking"
                value={booking.confirmedRequestNotBooking ? 'Yes' : 'Not asked'}
              />
            </dl>
          </section>

          <section className="rounded-2xl border-2 border-ocean-200 bg-ocean-50/50 p-6">
            <h2 className="text-xl">Message from the customer</h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ocean-800">
              Customer-provided — do not edit
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {booking.importantMessage?.trim() || 'None provided.'}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl">Audit trail</h2>
            <ol className="mt-4 space-y-3">
              {booking.events.map((event) => (
                <li key={event.id} className="border-l-2 border-slate-200 pl-4 text-sm">
                  <p className="font-semibold text-ink">{event.type}</p>
                  <p className="text-ink-muted">
                    {event.createdAt.toISOString().replace('T', ' ').slice(0, 19)} · {event.actor}
                  </p>
                  {event.detail && <p className="mt-1 text-ink-soft">{event.detail}</p>}
                </li>
              ))}
            </ol>

            <dl className="mt-6 grid gap-3 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
              <Detail label="Created" value={iso(booking.createdAt)} />
              <Detail label="Last updated" value={iso(booking.updatedAt)} />
              {/*
                Deliberately not labelled "consent": booking data is processed
                under Article 6(1)(b), and since the tick-boxes were removed
                this is the moment the customer submitted under the acceptance
                notice. The "How terms were accepted" row below says which.
              */}
              <Detail label="Terms accepted" value={iso(booking.consentedAt)} />
              <Detail
                label="How terms were accepted"
                value={
                  booking.events.some((event) => event.type === 'terms-accepted')
                    ? 'By submitting the form, under the acceptance notice'
                    : 'By ticking the confirmation boxes shown at the time'
                }
                className="sm:col-span-2"
              />
              <Detail
                label="Acknowledgement email"
                value={emailStatusLabel(
                  booking.customerEmailStatus,
                  booking.customerEmailSentAt,
                )}
              />
              <Detail
                label="Business notification"
                value={emailStatusLabel(
                  booking.businessEmailStatus,
                  booking.businessEmailSentAt,
                )}
              />
              {booking.emailLastErrorCode && (
                <Detail
                  label="Last email error"
                  value={`${booking.emailLastErrorCode} (${booking.emailRetryCount} attempt${
                    booking.emailRetryCount === 1 ? '' : 's'
                  })`}
                />
              )}
              <Detail
                label="Confirmed"
                value={booking.confirmedAt ? iso(booking.confirmedAt) : '—'}
              />
            </dl>
          </section>
        </div>

        <div className="lg:col-span-1">
          <BookingActionsPanel
            bookingId={booking.id}
            status={booking.status}
            currentDate={booking.date}
            currentStartTime={booking.startTime}
            staffNotes={booking.staffNotes ?? ''}
            slotStarts={slots.map((slot) => slot.start)}
            bookableDates={bookableDates}
          />
        </div>
      </div>
    </div>
  );
}

function iso(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * A booking is never rolled back because email failed, so the admin needs to
 * see at a glance which customers have not actually heard from us.
 */
function emailStatusLabel(status: string, sentAt: Date | null): string {
  switch (status) {
    case 'SENT':
      return sentAt ? `Sent ${iso(sentAt)}` : 'Sent';
    case 'FAILED':
      return 'FAILED — contact the customer directly';
    case 'SKIPPED':
      return 'Not sent (console email provider)';
    default:
      return 'Pending';
  }
}

function Detail({
  label,
  value,
  href,
  className,
}: {
  label: string;
  value: string;
  href?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink">
        {href ? (
          <a href={href} className="underline decoration-brand-300 underline-offset-4">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
