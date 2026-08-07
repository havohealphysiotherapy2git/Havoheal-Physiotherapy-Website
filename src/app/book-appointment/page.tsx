import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Home,
  BadgePoundSterling,
  ShieldCheck,
} from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, serviceSchema, webPageSchema } from '@/lib/structured-data';

import { bookingConfig, priceLabel } from '@/config/booking';
import { company, mailtoWithSubject, telHref, whatsappHref } from '@/config/site';
import {
  addDays,
  getDatesWithAvailability,
  getFirstDateWithAvailability,
  getSlotAvailability,
  todayInBusinessTz,
} from '@/lib/slots';
import {
  getAvailabilityForDate,
  getBlockedDatesFromDb,
  getFullyBookedDates,
} from '@/lib/bookings';
import type { BookingRules, SlotAvailability } from '@/lib/slots';

import { PageHeader } from '@/components/layout/page-header';
import { BookingForm } from '@/components/booking/booking-form';
import type { SlotOption } from '@/components/booking/slot-picker';
import { EmergencyNotice } from '@/components/sections/notices';

export const metadata: Metadata = metadataFor('/book-appointment');

/** Availability is live data, so this page is never statically cached. */
export const dynamic = 'force-dynamic';

/** Config rules with database closures folded into `blockedDates`. */
function mergeBlockedDates(rules: BookingRules, extra: string[]): BookingRules {
  if (extra.length === 0) return rules;
  return { ...rules, blockedDates: [...rules.blockedDates, ...extra] };
}

function toSlotOptions(availability: SlotAvailability[]): SlotOption[] {
  return availability.map((slot) => ({
    start: slot.start,
    end: slot.end,
    available: slot.available,
    ...(slot.unavailableReason ? { reason: slot.unavailableReason } : {}),
  }));
}

export default async function BookAppointmentPage() {
  const entry = getPageEntry('/book-appointment')!;
  const now = new Date();

  const today = todayInBusinessTz(now);

  // Dates the business has closed in the database, on top of the ones in
  // configuration. Fetched first so a closed date never appears in the calendar
  // — previously it was only caught at submission, after the visitor had filled
  // the whole form in.
  let dbBlockedDates: string[] = [];
  let availabilityDegraded = false;

  try {
    dbBlockedDates = await getBlockedDatesFromDb();
  } catch (error) {
    console.error('[booking] blocked dates unavailable', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    availabilityDegraded = true;
  }

  // Configuration rules plus database closures. Only dates that still have a
  // selectable slot are offered: late in the day "today" is technically open
  // but every slot has passed, and a calendar of greyed-out times is a poor
  // first impression.
  const rules = mergeBlockedDates(bookingConfig, dbBlockedDates);
  const bookableDates = getDatesWithAvailability(now, rules);
  const initialDate = getFirstDateWithAvailability(now, rules) ?? today;
  const minDate = bookableDates[0] ?? today;
  const maxDate = addDays(today, bookingConfig.bookingHorizonDays);

  // The form must still render if the database is unreachable — a visitor can
  // then submit a request that fails loudly, or fall back to phone/WhatsApp,
  // rather than meeting a blank page.
  let initialSlots: SlotOption[];
  let fullyBookedDates: string[] = [];

  try {
    const [availability, fullDates] = await Promise.all([
      getAvailabilityForDate(initialDate, now),
      // Empty unless a per-slot limit is configured: with unlimited capacity a
      // date can never fill up.
      getFullyBookedDates(bookableDates.slice(0, 21), now),
    ]);
    initialSlots = toSlotOptions(availability);
    fullyBookedDates = fullDates;
  } catch (error) {
    console.error('[booking] initial availability unavailable', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    availabilityDegraded = true;
    initialSlots = toSlotOptions(getSlotAvailability(initialDate, {}, now, rules));
  }

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/book-appointment',
            title: entry.title,
            description: entry.description,
          }),
          serviceSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Book an Appointment', path: '/book-appointment' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Online booking"
        title="Book a Home Physiotherapy Visit"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Book a Home Visit', path: '/book-appointment' },
        ]}
        intro={
          <>
            Choose your preferred appointment date and time — we take requests seven days a week,
            from {bookingConfig.openingTime} to {bookingConfig.closingTime}. A physiotherapy
            professional will travel to the address you provide, subject to availability and
            postcode coverage. The price is a fixed {priceLabel}.
          </>
        }
      >
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-ink-soft">
          <div className="flex items-center gap-2">
            <Home className="size-4 text-brand-700" aria-hidden="true" />
            <dt className="sr-only">Where</dt>
            <dd>At your home</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-brand-700" aria-hidden="true" />
            <dt className="sr-only">Duration</dt>
            <dd>{bookingConfig.slotDurationMinutes}-minute visit</dd>
          </div>
          <div className="flex items-center gap-2">
            <BadgePoundSterling className="size-4 text-brand-700" aria-hidden="true" />
            <dt className="sr-only">Price</dt>
            <dd>{priceLabel} fixed price</dd>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand-700" aria-hidden="true" />
            <dt className="sr-only">Card details</dt>
            <dd>No card details taken on this website</dd>
          </div>
        </dl>
      </PageHeader>

      <section className="section-tight bg-white">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <BookingForm
                initialDate={initialDate}
                minDate={minDate}
                maxDate={maxDate}
                bookableDates={bookableDates}
                fullyBookedDates={fullyBookedDates}
                initialSlots={initialSlots}
                availabilityDegraded={availabilityDegraded}
              />
            </div>

            <aside className="space-y-5 lg:col-span-4" aria-label="Other ways to book">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <h2 className="text-xl">Prefer to talk to someone?</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  You can arrange the same {bookingConfig.slotDurationMinutes}-minute home visit
                  by phone, WhatsApp or email. The price is identical.
                </p>
                <div className="mt-5 space-y-3">
                  <a
                    href={telHref}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-brand-700 bg-white px-4 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
                  >
                    <Phone className="size-5" aria-hidden="true" />
                    {company.phoneDisplay}
                  </a>
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#0f7a52] bg-[#0f7a52] px-4 py-3 font-semibold text-white transition hover:bg-[#0b6242]"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    Book on WhatsApp
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <a
                    href={mailtoWithSubject('Home Physiotherapy Enquiry')}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <Mail className="size-5 text-brand-700" aria-hidden="true" />
                    {company.email}
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-lg">What happens next</h2>
                <ol className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
                  <li>
                    <strong className="font-semibold text-ink">1. Acknowledgement.</strong> You
                    receive an email with your booking reference immediately.
                  </li>
                  <li>
                    <strong className="font-semibold text-ink">2. Availability and coverage
                    check.</strong> We review the request against the diary and confirm we can
                    reach your postcode.
                  </li>
                  <li>
                    <strong className="font-semibold text-ink">3. Confirmation.</strong> We
                    contact you to confirm the visit or offer an alternative time.
                  </li>
                </ol>
                <p className="mt-4 text-xs text-ink-muted">
                  See our{' '}
                  <Link
                    href="/booking-and-cancellation-policy"
                    className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    Booking and Cancellation Policy
                  </Link>{' '}
                  for how changes and cancellations work.
                </p>
              </div>

              <EmergencyNotice />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
