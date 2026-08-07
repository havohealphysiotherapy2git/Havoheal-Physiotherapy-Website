import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, Info } from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import {
  breadcrumbSchema,
  faqPageSchema,
  jsonLdGraph,
  serviceSchema,
  webPageSchema,
} from '@/lib/structured-data';

import { bookingConfig, priceLabel, travelCostStatement } from '@/config/booking';
import { pricingExcludes, pricingIncludes } from '@/config/services';
import { faqs } from '@/config/faqs';

import { PageHeader } from '@/components/layout/page-header';
import { BookingActions, FinalCta } from '@/components/sections/cta';
import { FaqList } from '@/components/sections/faq-list';
import { OwnerPlaceholder } from '@/components/sections/notices';
import { MovementArcs } from '@/components/graphics/decor';

export const metadata: Metadata = metadataFor('/physiotherapy-pricing');

export default function PricingPage() {
  const entry = getPageEntry('/physiotherapy-pricing')!;
  const pricingFaqs = faqs.filter((faq) => faq.category === 'Pricing');

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/physiotherapy-pricing',
            title: entry.title,
            description: entry.description,
          }),
          serviceSchema(),
          faqPageSchema(pricingFaqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Home Physiotherapy Pricing', path: '/physiotherapy-pricing' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Transparent pricing"
        title="Home physiotherapy pricing"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Home Physiotherapy Pricing', path: '/physiotherapy-pricing' },
        ]}
        intro={
          <>
            One price, published openly, so you know what a home visit costs before you get in
            touch.
          </>
        }
      />

      {/* Price card */}
      <section className="section-tight bg-white" aria-labelledby="price-heading">
        <div className="container">
          <div className="relative overflow-hidden rounded-4xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-ocean-50 p-7 shadow-card sm:p-10">
            <MovementArcs className="absolute -bottom-16 -right-12 h-72 w-72 opacity-20" />

            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <h2 id="price-heading" className="text-2xl sm:text-3xl">
                  {bookingConfig.slotDurationMinutes}-minute home physiotherapy visit
                </h2>
                <p className="mt-4 font-display text-6xl font-semibold text-brand-900">
                  {priceLabel}
                </p>
                <p className="mt-2 text-lg font-medium text-ink-soft">
                  Fixed price, per home visit
                </p>
                <p className="mt-4 leading-relaxed text-ink-soft">
                  The same price applies to every visit we offer, wherever you are in our service
                  area. There is no separate consultation or assessment fee.
                </p>
                <BookingActions location="pricing_hero" className="mt-7" />
              </div>

              <div className="lg:col-span-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg">What the visit includes</h3>
                    <ul className="mt-4 space-y-2.5">
                      {pricingIncludes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-brand-600"
                            aria-hidden="true"
                          />
                          <span className="leading-relaxed text-ink-soft">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg">What is not included</h3>
                    <ul className="mt-4 space-y-2.5">
                      {pricingExcludes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <X
                            className="mt-0.5 size-4 shrink-0 text-coral-600"
                            aria-hidden="true"
                          />
                          <span className="leading-relaxed text-ink-soft">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-5 flex items-start gap-2 rounded-2xl border border-sand-300 bg-sand-50 p-4 text-sm leading-relaxed text-sand-900">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    <OwnerPlaceholder>For the website owner:</OwnerPlaceholder> the two lists
                    above are editable placeholders in{' '}
                    <code className="rounded bg-white px-1 py-0.5 text-xs">
                      src/config/services.ts
                    </code>
                    . Please confirm every line is accurate, and remove anything that is not,
                    before launch.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment and value */}
      <section className="section layered-bg-soft" aria-labelledby="payment-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 id="travel-heading" className="text-3xl sm:text-4xl">
                Travel to your address
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{travelCostStatement}</p>
              {bookingConfig.travelIncludedInPrice === null && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl border border-sand-300 bg-sand-50 p-4 text-sm leading-relaxed text-sand-900">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    <OwnerPlaceholder>For the website owner:</OwnerPlaceholder> set{' '}
                    <code className="rounded bg-white px-1 py-0.5 text-xs">
                      travelIncludedInPrice
                    </code>{' '}
                    in <code className="rounded bg-white px-1 py-0.5 text-xs">
                      src/config/booking.ts
                    </code>{' '}
                    to <code>true</code> or <code>false</code> once confirmed. Until then the site
                    deliberately makes no claim either way, here or in the FAQs.
                  </span>
                </p>
              )}

              <h2 id="payment-heading" className="mt-10 text-3xl sm:text-4xl">
                How and when you pay
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                This website does not take payments and never asks for card details. Payment
                arrangements are confirmed with you when we contact you about your booking
                request.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                <OwnerPlaceholder>Owner to confirm:</OwnerPlaceholder> accepted payment methods
                and when payment is due (for example, on the day of the appointment). Once
                confirmed, this paragraph should be updated with the exact arrangement.
              </p>

              <h3 className="mt-8 text-xl">Changing or cancelling</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">
                Contact us by phone or WhatsApp quoting your booking reference. Please give as
                much notice as you can. The notice period and any charges are set out in our{' '}
                <Link
                  href="/booking-and-cancellation-policy"
                  className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                >
                  Booking and Cancellation Policy
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl">Pricing questions</h2>
              <div className="mt-6">
                <FaqList items={pricingFaqs} idPrefix="pricing-faq" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <FinalCta
        location="pricing_final"
        heading="Book your 45-minute home visit for £75"
        body="One fixed price, four ways to book, and unhurried time to talk properly about what you have noticed — in your own home."
      />
    </>
  );
}
