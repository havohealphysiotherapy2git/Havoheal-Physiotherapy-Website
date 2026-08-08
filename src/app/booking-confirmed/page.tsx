import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { CheckCircle2, Phone, MessageCircle, Mail, CalendarDays } from 'lucide-react';

import { buildMetadata } from '@/lib/seo';
import { verifyValue } from '@/lib/signed-value';
import { CONFIRMATION_COOKIE } from '@/lib/booking-cookie';
import { getBookingByReference } from '@/lib/bookings';
import { bookingConfig, bookingStatusLabels } from '@/config/booking';
import { formatLongDate } from '@/lib/slots';
import { formatPrice } from '@/lib/validation';
import {
  company,
  mailtoHref,
  mailtoWithSubject,
  telHref,
  whatsappHref,
} from '@/config/site';

import { Button } from '@/components/ui/button';
import { EmergencyNotice } from '@/components/sections/notices';
import { MovementArcs, GradientBlob } from '@/components/graphics/decor';

/**
 * Booking confirmation.
 *
 * The booking reference arrives in a signed, httpOnly cookie set by the server
 * action — never in the URL. That keeps booking details out of browser history,
 * referrer headers, analytics page paths and access logs, and means the page
 * cannot be used to enumerate other people's bookings.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Booking request received | Havoheal Physiotherapy',
  description:
    'Your home physiotherapy booking request has been received. Your booking reference and visit details are shown here.',
  path: '/booking-confirmed',
  noindex: true,
});

export const dynamic = 'force-dynamic';

export default async function BookingConfirmedPage() {
  const cookieStore = await cookies();
  const reference = verifyValue(cookieStore.get(CONFIRMATION_COOKIE)?.value);

  const booking = reference
    ? await getBookingByReference(reference).catch(() => null)
    : null;

  return (
    <section className="relative overflow-hidden layered-bg">
      <GradientBlob className="absolute -right-32 -top-32 h-[30rem] w-[30rem] opacity-45" />

      <div className="container relative py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {booking ? (
            <>
              <div className="relative overflow-hidden rounded-4xl border border-brand-200 bg-white p-7 shadow-lift sm:p-10">
                <MovementArcs className="absolute -bottom-14 -right-10 h-64 w-64 opacity-[0.14]" />

                <div className="relative">
                  <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
                    <CheckCircle2 className="size-8" aria-hidden="true" />
                  </span>

                  <h1 className="mt-6 text-3xl sm:text-4xl">
                    Thanks for booking your home physiotherapy visit. You will receive a booking
                    acknowledgement shortly.
                  </h1>

                  <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                    {bookingConfig.autoConfirmBookings
                      ? 'Your home visit is confirmed for the date and time below.'
                      : `Your appointment is not fully confirmed until you receive confirmation from ${company.legalName}. We check availability and postcode coverage, then contact you to confirm the time or offer an alternative.`}
                  </p>

                  <div className="mt-8 rounded-3xl border-2 border-brand-200 bg-brand-50/60 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-800">
                      Your booking reference
                    </p>
                    <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-900">
                      {booking.reference}
                    </p>
                    <p className="mt-2 text-sm text-brand-900/80">
                      Please quote this whenever you contact us about this appointment.
                    </p>
                  </div>

                  <h2 className="mt-9 text-xl">Home-visit details</h2>
                  <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                    <Row label="Date" value={formatLongDate(booking.date)} />
                    <Row label="Time" value={`${booking.startTime} – ${booking.endTime}`} />
                    <Row label="Duration" value={`${booking.durationMinutes} minutes`} />
                    <Row label="Price" value={`${formatPrice(booking.priceInPence)} fixed price`} />
                    <Row label="Visiting" value={`Your address in ${booking.postcode}`} />
                    <Row label="Status" value={bookingStatusLabels[booking.status]} />
                    <Row label="Name" value={booking.fullName} />
                  </dl>

                  {/* The booking is saved either way; this only changes what we
                      ask the customer to do next. */}
                  {booking.customerEmailStatus === 'FAILED' ? (
                    <p className="mt-5 flex items-start gap-2 rounded-2xl border-2 border-sand-300 bg-sand-50 p-4 text-sm leading-relaxed text-sand-900">
                      <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>
                        Your booking request has been saved, but we could not send the
                        acknowledgement email immediately. Please contact{' '}
                        <a
                          href={mailtoHref}
                          className="font-semibold underline decoration-sand-400 underline-offset-4"
                        >
                          {company.email}
                        </a>{' '}
                        if you do not hear from us shortly. Quote reference {booking.reference}.
                      </span>
                    </p>
                  ) : (
                    <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
                      <Mail className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                      <span>
                        An acknowledgement has been sent to the email address you gave us. If it
                        has not arrived within a few minutes, check your spam folder, then call or
                        message us on {company.phoneDisplay}.
                      </span>
                    </p>
                  )}

                  <h2 className="mt-9 text-xl">Questions about your booking?</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">
                    For questions about your booking, email{' '}
                    <a
                      href={mailtoWithSubject(`Booking ${booking.reference}`)}
                      className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                    >
                      {company.email}
                    </a>
                    , call{' '}
                    <a
                      href={telHref}
                      className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                    >
                      {company.phoneDisplay}
                    </a>{' '}
                    or contact us on WhatsApp. Please quote your reference, and give as much
                    notice as you can if you need to change the visit.
                  </p>

                  {/*
                    `flex-wrap` + `flex-1 min-w-fit` on each button:
                      - min-w-fit stops a button shrinking below its own text,
                        which is what made "Call +44 7469 334067" wrap onto two
                        lines while the others kept their natural width;
                      - flex-1 then shares the leftover space equally, so all
                        three end up the same width on desktop;
                      - when the three no longer fit, they wrap to full-width
                        rows instead of being squashed — no media query needed.
                  */}
                  <div className="mt-5 flex flex-wrap items-stretch gap-3">
                    <Button
                      asChild
                      size="md"
                      variant="secondary"
                      className="min-w-fit flex-1 whitespace-nowrap"
                    >
                      <a href={telHref}>
                        <Phone aria-hidden="true" />
                        Call {company.phoneDisplay}
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="md"
                      variant="whatsapp"
                      className="min-w-fit flex-1 whitespace-nowrap"
                    >
                      <a
                        href={whatsappHref(
                          `Hello Havoheal Physiotherapy, I would like to talk about booking reference ${booking.reference}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle aria-hidden="true" />
                        Message on WhatsApp
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="md"
                      variant="subtle"
                      className="min-w-fit flex-1 whitespace-nowrap"
                    >
                      <a href={mailtoWithSubject(`Booking ${booking.reference}`)}>
                        <Mail aria-hidden="true" />
                        Email us
                      </a>
                    </Button>
                  </div>

                  <p className="mt-6 text-sm text-ink-muted">
                    Full details are in our{' '}
                    <Link
                      href="/booking-and-cancellation-policy"
                      className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
                    >
                      Booking and Cancellation Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <EmergencyNotice className="mt-8" />
            </>
          ) : (
            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-brand-800">
                <CalendarDays className="size-7" aria-hidden="true" />
              </span>

              <h1 className="mt-6 text-3xl">We cannot show a booking here</h1>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                This page shows the details of a booking request you have just submitted. The
                confirmation link expires after a couple of hours, and it will not work in a
                different browser or on another device — that is deliberate, so booking details
                are never exposed in a URL.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                If you have already submitted a request, check your email for the acknowledgement
                and your booking reference. If you have not booked yet, you can start now.
              </p>

              {/* Same wrapping rule as the confirmed-booking row above. */}
              <div className="mt-7 flex flex-wrap items-stretch gap-3">
                <Button asChild size="md" className="min-w-fit flex-1 whitespace-nowrap">
                  <Link href="/book-appointment">Book a home visit</Link>
                </Button>
                <Button
                  asChild
                  size="md"
                  variant="secondary"
                  className="min-w-fit flex-1 whitespace-nowrap"
                >
                  <a href={telHref}>
                    <Phone aria-hidden="true" />
                    Call {company.phoneDisplay}
                  </a>
                </Button>
                {/*
                  This one shows the full address rather than a short label, and
                  it is longer than a phone screen is wide. `basis-full` gives it
                  its own row, and `min-w-0` + `break-all` let it wrap instead of
                  being clipped by the card — the opposite treatment to the
                  fixed-width buttons above, for the opposite reason.
                */}
                <Button
                  asChild
                  size="md"
                  variant="subtle"
                  className="min-w-0 flex-1 basis-full break-all"
                >
                  <a href={mailtoHref}>
                    <Mail aria-hidden="true" />
                    {company.email}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 bg-white px-5 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-ink-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
