import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, MapPin } from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import {
  breadcrumbSchema,
  faqPageSchema,
  jsonLdGraph,
  serviceSchema,
  webPageSchema,
} from '@/lib/structured-data';

import { areaGroups, coverageCaveat } from '@/config/areas';
import { bookingConfig, priceLabel } from '@/config/booking';
import { faqs } from '@/config/faqs';
import { generateSlots } from '@/lib/slots';

import { PageHeader } from '@/components/layout/page-header';
import { BookingActions, FinalCta } from '@/components/sections/cta';
import {
  CoverageCallout,
  MedicalDisclaimer,
  RegisteredOfficeNote,
} from '@/components/sections/notices';
import { FaqList } from '@/components/sections/faq-list';
import { Card, CardBody, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = metadataFor('/birmingham-physiotherapy');

const birminghamFaqQuestions = [
  'Do you provide physiotherapy at home?',
  'Do you operate from a Birmingham clinic?',
  'Which areas do you visit?',
  'How much does a home visit cost?',
  'Is travel included in the £75 price?',
  'What times are appointments available?',
];

export default function BirminghamPage() {
  const entry = getPageEntry('/birmingham-physiotherapy')!;
  const birminghamGroup = areaGroups.find((group) => group.id === 'birmingham');
  const pageFaqs = faqs.filter((faq) => birminghamFaqQuestions.includes(faq.question));
  const slots = generateSlots();

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/birmingham-physiotherapy',
            title: entry.title,
            description: entry.description,
          }),
          serviceSchema(),
          faqPageSchema(pageFaqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Areas We Cover', path: '/areas-we-cover' },
            { name: 'Birmingham Home Physiotherapy', path: '/birmingham-physiotherapy' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Birmingham and nearby districts"
        title="A home visit physiotherapist for Birmingham"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Areas We Cover', path: '/areas-we-cover' },
          { name: 'Birmingham Home Physiotherapy', path: '/birmingham-physiotherapy' },
        ]}
        intro={
          <>
            Private physiotherapy delivered at home for people in and around Birmingham.{' '}
            {bookingConfig.slotDurationMinutes} minutes, a fixed {priceLabel}, and four ways to
            book: online, by phone, by email or on WhatsApp.
          </>
        }
      >
        <BookingActions location="birmingham_hero" />
      </PageHeader>

      <section className="section bg-white" aria-labelledby="why-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 id="why-heading" className="text-3xl sm:text-4xl">
                Physiotherapy that comes to you in Birmingham
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                Birmingham is our primary service area, and we travel to you. Whether you are in
                the city centre, out towards Sutton Coldfield and Erdington, south through Selly
                Oak, Bournville and Kings Heath, or east around Yardley, Sheldon and Acocks Green,
                the visit, the length and the price are the same.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                For many people that is the whole point: no parking near a clinic, no bus with a
                painful knee, no waiting room. If travelling is part of what you are finding
                difficult, it should not be the barrier to getting seen.
              </p>

              <h3 className="mt-8 text-xl">What booking with us involves</h3>
              <ul className="mt-4 space-y-3">
                {[
                  `A full ${bookingConfig.slotDurationMinutes} minutes at your own address`,
                  `A single fixed price of ${priceLabel} — no separate consultation fee`,
                  'Booking online, by phone, by email or on WhatsApp, whichever you prefer',
                  'An acknowledgement with a booking reference straight away',
                  'A conversation about options, not a promise of a particular outcome',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                    <span className="leading-relaxed text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border-2 border-ocean-200 bg-ocean-50 p-5">
                <h3 className="text-lg text-ocean-950">A note on our address</h3>
                <RegisteredOfficeNote className="mt-2 text-ocean-950/80" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card className="sticky top-28">
                <CardTitle as="h2">Visit start times</CardTitle>
                <CardBody>
                  Home visits run through the working day from {bookingConfig.openingTime}, with
                  the last one finishing by {bookingConfig.closingTime}.
                </CardBody>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <li
                      key={slot.start}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-ink-soft"
                    >
                      {slot.start}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-ink-muted">
                  Only times that are still free are offered when you book. Availability is
                  re-checked when you submit.
                </p>
                <p className="mt-5">
                  <Link
                    href="/book-appointment"
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                  >
                    Book home physiotherapy in Birmingham
                  </Link>
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Birmingham districts */}
      <section className="section layered-bg-soft" aria-labelledby="districts-heading">
        <div className="container">
          <h2 id="districts-heading" className="text-3xl sm:text-4xl">
            Birmingham districts we visit
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
            {birminghamGroup?.intro} We also travel to surrounding Birmingham neighbourhoods
            within the marked service boundary. {coverageCaveat}
          </p>

          <ul className="mt-7 flex flex-wrap gap-2">
            {birminghamGroup?.areas.map((area) => (
              <li
                key={area}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft shadow-sm"
              >
                <MapPin className="size-3.5 text-brand-600" aria-hidden="true" />
                {area}
              </li>
            ))}
          </ul>

          <p className="mt-6">
            <Link
              href="/areas-we-cover"
              className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
            >
              View our full home-visit coverage area, including the Black Country, Solihull and
              Lichfield
            </Link>
          </p>

          <CoverageCallout className="mt-8" />
        </div>
      </section>

      <section className="section bg-white" aria-labelledby="birmingham-faq-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id="birmingham-faq-heading" className="text-3xl sm:text-4xl">
                Birmingham home-visit questions
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                The questions people in Birmingham ask us most often before booking.
              </p>
            </div>
            <div className="lg:col-span-8">
              <FaqList items={pageFaqs} idPrefix="birmingham-faq" />
              <MedicalDisclaimer className="mt-8" />
            </div>
          </div>
        </div>
      </section>

      <FinalCta
        location="birmingham_final"
        heading="Book a 45-minute home visit in Birmingham"
        body="Pick a time that works for you, or send us your postcode and we will confirm we can reach you."
      />
    </>
  );
}
