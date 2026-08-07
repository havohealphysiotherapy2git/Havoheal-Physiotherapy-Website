import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Clock,
  Tag,
  CalendarCheck,
  MessageSquare,
  MapPin,
  Check,
  ArrowRight,
  House,
  BadgePoundSterling,
} from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import {
  breadcrumbSchema,
  faqPageSchema,
  jsonLdGraph,
  serviceSchema,
  webPageSchema,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/json-ld';

import { company, telHref, whatsappHref } from '@/config/site';
import { bookingConfig, priceLabel, travelCostStatement } from '@/config/booking';
import { bookingSteps, pricingIncludes, trustPoints } from '@/config/services';
import { areaPhrases, headlineAreas } from '@/config/areas';
import { featuredFaqs } from '@/config/faqs';
import { generateSlots } from '@/lib/slots';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { BookingActions, FinalCta } from '@/components/sections/cta';
import { CoverageCallout, MedicalDisclaimer } from '@/components/sections/notices';
import { ServiceCards } from '@/components/sections/service-cards';
import { FaqList } from '@/components/sections/faq-list';
import { WeComeToYou } from '@/components/sections/we-come-to-you';
import { PostcodeChecker } from '@/components/sections/postcode-checker';
import {
  DotGrid,
  GradientBlob,
  HomeVisitMotif,
  WaveDivider,
} from '@/components/graphics/decor';

export const metadata: Metadata = metadataFor('/');

const trustIcons = {
  house: House,
  clock: Clock,
  tag: Tag,
  calendar: CalendarCheck,
  message: MessageSquare,
  map: MapPin,
} as const;

export default function HomePage() {
  const entry = getPageEntry('/')!;
  const slots = generateSlots();
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({ path: '/', title: entry.title, description: entry.description }),
          serviceSchema(),
          faqPageSchema(featuredFaqs),
          breadcrumbSchema([{ name: 'Home', path: '/' }]),
        )}
      />

      {/* ------------------------------------------------------------ */}
      {/* Hero                                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="relative overflow-hidden layered-bg">
        <GradientBlob className="absolute -left-40 -top-32 h-[34rem] w-[34rem] opacity-60" />
        <GradientBlob
          from="#ff7a61"
          to="#3382fc"
          className="absolute -right-32 top-24 h-[26rem] w-[26rem] opacity-35"
        />
        <DotGrid className="absolute inset-x-0 top-0 h-64 text-brand-200/60" />

        <div className="container relative grid items-center gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-7">
            <p className="eyebrow">
              <House className="size-3.5" aria-hidden="true" />
              Home-Visit Physiotherapy Across Birmingham
            </p>

            <h1 className="mt-5 text-[2.1rem] leading-[1.12] sm:text-5xl lg:text-[3.4rem]">
              Professional Physiotherapy in the{' '}
              <span className="gradient-text">Comfort of Your Own Home</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              {company.displayName} brings professional{' '}
              {bookingConfig.slotDurationMinutes}-minute physiotherapy appointments directly to
              your home across {company.primaryServiceArea}. Book a convenient home visit online,
              by phone or through WhatsApp for a fixed price of {priceLabel}.
            </p>

            {/* The four facts that decide whether someone books. */}
            <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              {[
                { icon: BadgePoundSterling, term: 'Price', value: `${priceLabel} fixed price` },
                {
                  icon: Clock,
                  term: 'Duration',
                  value: `${bookingConfig.slotDurationMinutes}-minute appointment`,
                },
                { icon: House, term: 'Where', value: 'Home visit' },
                { icon: MapPin, term: 'Coverage', value: company.primaryServiceArea },
              ].map((item) => (
                <div
                  key={item.term}
                  className="flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-ink"
                >
                  <item.icon className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <dt className="sr-only">{item.term}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            <BookingActions location="home_hero" className="mt-7" />

            <p className="mt-5 text-sm text-ink-muted">
              Phone and WhatsApp:{' '}
              <a
                href={telHref}
                className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
              >
                {company.phoneDisplay}
              </a>
              {' · '}
              Visit start times from {firstSlot?.start} to {lastSlot?.start}.
            </p>
          </div>

          {/* Hero card — "we come to you", with the price stated plainly. */}
          <div className="lg:col-span-5">
            <div className="glass relative overflow-hidden rounded-4xl p-7 sm:p-8">
              <HomeVisitMotif className="absolute -bottom-10 -right-10 h-56 w-72 opacity-[0.16]" />

              <div className="relative">
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-3.5 py-1.5 text-sm font-semibold text-white">
                  <House className="size-4" aria-hidden="true" />
                  We come to you
                </p>

                <p className="mt-5 font-display text-5xl font-semibold text-ink">{priceLabel}</p>
                <p className="mt-1 text-lg font-medium text-ink-soft">
                  for a {bookingConfig.slotDurationMinutes}-minute visit at your home
                </p>

                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    'One fixed price — no separate consultation fee',
                    'No clinic to travel to and no waiting room',
                    'Book online, by phone, email or on WhatsApp',
                    `Covering ${company.primaryServiceArea}`,
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                      <span className="text-ink-soft">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild block size="lg" className="mt-7">
                  <Link href="/book-appointment">
                    <CalendarCheck aria-hidden="true" />
                    Book a Home Visit
                  </Link>
                </Button>

                <p className="mt-3 text-center text-xs text-ink-muted">
                  Submitting the form creates a booking request. We confirm availability and
                  postcode coverage with you.
                </p>
              </div>
            </div>
          </div>
        </div>

        <WaveDivider fill="#ffffff" />
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Trust and convenience strip                                   */}
      {/* ------------------------------------------------------------ */}
      <section className="border-y border-slate-200 bg-white" aria-labelledby="trust-heading">
        <div className="container py-10">
          <h2 id="trust-heading" className="sr-only">
            What every {company.displayName} home visit includes
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {trustPoints.map((point) => {
              const Icon = trustIcons[point.icon];
              return (
                <li key={point.title} className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">
                      {point.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{point.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* We come to you                                                */}
      {/* ------------------------------------------------------------ */}
      <WeComeToYou />

      {/* ------------------------------------------------------------ */}
      {/* Services                                                      */}
      {/* ------------------------------------------------------------ */}
      <section className="section layered-bg-soft" aria-labelledby="services-heading">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">What we cover</p>
            <h2 id="services-heading" className="mt-4 text-3xl sm:text-4xl">
              At-home physiotherapy for a range of movement concerns
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Every visit is {bookingConfig.slotDurationMinutes} minutes, which is enough time to
              talk properly about what you have noticed, look at how you move in your own
              surroundings where that is appropriate, and agree practical next steps together.
            </p>
          </div>

          <div className="mt-10">
            <ServiceCards />
          </div>

          <MedicalDisclaimer className="mt-10" />
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* How booking works                                             */}
      {/* ------------------------------------------------------------ */}
      <section className="section bg-white" aria-labelledby="how-booking-works">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">Three steps</p>
            <h2 id="how-booking-works" className="mt-4 text-3xl sm:text-4xl">
              How booking works
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Booking a home visit online takes a couple of minutes. If you would rather speak to
              someone, call or message {company.phoneDisplay} instead.
            </p>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <li key={step.step}>
                <Card className="h-full">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-ocean-700 font-display text-lg font-semibold text-white"
                  >
                    {step.step}
                  </span>
                  <CardTitle className="mt-5">
                    <span className="sr-only">Step {step.step}: </span>
                    {step.title}
                  </CardTitle>
                  <CardBody>{step.body}</CardBody>
                </Card>
              </li>
            ))}
          </ol>

          <p className="mt-6 rounded-2xl border border-ocean-200 bg-ocean-50 p-5 text-sm leading-relaxed text-ocean-950">
            <strong className="font-semibold">Please note:</strong> submitting the form creates a
            booking request rather than a confirmed appointment. We check availability and
            postcode coverage, then contact you to confirm the visit or offer an alternative.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Coverage area                                                 */}
      {/* ------------------------------------------------------------ */}
      <section className="section layered-bg-soft" aria-labelledby="coverage-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow">Where we travel</p>
              <h2 id="coverage-heading" className="mt-4 text-3xl sm:text-4xl">
                Home visits across Birmingham and surrounding areas
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                We travel across Birmingham, the Black Country and the towns around them — from
                Wolverhampton and Dudley in the west to Solihull and Knowle in the south-east, and
                up to Cannock and Lichfield in the north.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                {company.legalName} is registered in London. That is our registered office
                address, not a clinic, and nobody attends it — appointments happen at your home.
              </p>
              <p className="mt-6">
                <Link
                  href="/areas-we-cover"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                >
                  View our home-visit coverage area
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </p>
            </div>

            <div className="lg:col-span-7">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-800">
                Main towns and areas we visit
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {headlineAreas.map((area) => (
                  <li
                    key={area}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft shadow-sm"
                    title={areaPhrases[area] ?? `Home physiotherapy in ${area}`}
                  >
                    {area}
                  </li>
                ))}
              </ul>

              <PostcodeChecker />

              <CoverageCallout className="mt-6" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Pricing + booking preview                                     */}
      {/* ------------------------------------------------------------ */}
      <section className="section bg-white" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="eyebrow">Simple pricing</p>
              <h2 id="pricing-heading" className="mt-4 text-3xl sm:text-4xl">
                {bookingConfig.slotDurationMinutes}-minute home physiotherapy visit —{' '}
                {priceLabel} fixed price
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                One price for everyone, with no separate consultation fee and no surprise
                extras. Payment arrangements are confirmed when we contact you about your
                booking — this website does not take card details.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">{travelCostStatement}</p>

              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-brand-800">
                What the visit includes
              </h3>
              <ul className="mt-4 space-y-2.5">
                {pricingIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                    <span className="text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6">
                <Link
                  href="/physiotherapy-pricing"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                >
                  See home-visit pricing in full
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </p>
            </div>

            {/* Booking preview card */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-4xl border-2 border-brand-200 bg-gradient-to-br from-white via-brand-50/60 to-white p-7 shadow-card sm:p-9">
                <DotGrid className="absolute inset-0 text-brand-200/50" />

                <div className="relative">
                  <h3 className="text-2xl">Book a home visit in three steps</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">
                    Pick a date and a {bookingConfig.slotDurationMinutes}-minute slot, tell us
                    where to come, then review and submit.
                  </p>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-800">
                      Visit start times
                    </h4>
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Available start times">
                      {slots.map((slot) => (
                        <li
                          key={slot.start}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-ink-soft"
                        >
                          {slot.start}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-ink-muted">
                      Each visit lasts {bookingConfig.slotDurationMinutes} minutes. The last
                      appointment finishes by {bookingConfig.closingTime}. Only times that are
                      still free are offered when you book.
                    </p>
                  </div>

                  <Button asChild block size="lg" className="mt-6">
                    <Link href="/book-appointment">
                      <CalendarCheck aria-hidden="true" />
                      Book a Home Visit Online
                    </Link>
                  </Button>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button asChild variant="secondary" size="md" block>
                      <a href={telHref}>Call to Book</a>
                    </Button>
                    <Button asChild variant="whatsapp" size="md" block>
                      <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* FAQs                                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="section layered-bg-soft" aria-labelledby="faq-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">Questions</p>
              <h2 id="faq-heading" className="mt-4 text-3xl sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                The things people ask us most often about home visits, coverage, pricing and
                booking.
              </p>
              <p className="mt-5">
                <Link
                  href="/faqs"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                >
                  Read all home physiotherapy FAQs
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </p>
            </div>

            <div className="lg:col-span-8">
              <FaqList items={featuredFaqs} idPrefix="home-faq" />
            </div>
          </div>
        </div>
      </section>

      <FinalCta location="home_final" />
    </>
  );
}
