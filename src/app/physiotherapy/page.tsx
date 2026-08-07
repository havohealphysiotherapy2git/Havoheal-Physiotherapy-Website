import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Check,
  Clock,
  ClipboardList,
  MessagesSquare,
  Footprints,
  DoorOpen,
} from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, serviceSchema, webPageSchema } from '@/lib/structured-data';

import { bookingConfig, priceLabel } from '@/config/booking';
import { company } from '@/config/site';
import { faqs } from '@/config/faqs';

import { PageHeader } from '@/components/layout/page-header';
import { ServiceCards } from '@/components/sections/service-cards';
import { FinalCta } from '@/components/sections/cta';
import { MedicalDisclaimer, EmergencyNotice } from '@/components/sections/notices';
import { FaqList } from '@/components/sections/faq-list';
import { Card, CardBody, CardTitle, IconChip } from '@/components/ui/card';
import { AlignmentMotif } from '@/components/graphics/decor';

export const metadata: Metadata = metadataFor('/physiotherapy');

const cardTones = ['brand', 'ocean', 'violet', 'coral'] as const;

const appointmentStructure = [
  {
    icon: DoorOpen,
    title: 'We arrive at the time you booked',
    body: 'A physiotherapy professional travels to the address you gave us. The access notes you added when booking — a buzzer code, which entrance to use, where to park — mean the visit starts on time rather than with a phone call from your doorstep.',
  },
  {
    icon: MessagesSquare,
    title: 'Talking through what you have noticed',
    body: 'The visit starts with a conversation: what you have noticed, when it started, what makes it better or worse, and what you would most like to get back to doing.',
  },
  {
    icon: ClipboardList,
    title: 'A movement assessment where appropriate',
    body: 'Where it is relevant, we look at how the affected area moves — and because we are in your home, we can look at the actual stairs, chair or worktop involved rather than a description of them. Nothing happens without your agreement.',
  },
  {
    icon: Footprints,
    title: 'Discussing options and next steps',
    body: 'We talk through options that may suit your circumstances, using the space and equipment you already have. If another service is a better fit, we will say so.',
  },
];

const preparationTips = [
  'Clear a space large enough to move around in, and have a firm chair available.',
  'Wear comfortable clothing that allows you to move, and that gives access to the area you want to discuss.',
  'Think in advance about when your symptoms started and what makes them better or worse.',
  'Note down the activities you are finding difficult and what you would like to get back to.',
  'Add parking and access notes when you book — a buzzer code, a side entrance, or a dog we should know about.',
  'Let us know in advance if a family member, friend or carer will be with you.',
];

export default function PhysiotherapyPage() {
  const entry = getPageEntry('/physiotherapy')!;
  const pageFaqs = faqs.filter(
    (faq) => faq.category === 'Home visits' || faq.category === 'Appointments',
  );

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/physiotherapy',
            title: entry.title,
            description: entry.description,
          }),
          serviceSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Home Physiotherapy', path: '/physiotherapy' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="How it works"
        title="Home-Visit Physiotherapy in Birmingham"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Home Physiotherapy', path: '/physiotherapy' },
        ]}
        intro={
          <>
            Every appointment with {company.displayName} takes place at your home, lasts{' '}
            {bookingConfig.slotDurationMinutes} minutes and costs a fixed {priceLabel}. This page
            explains how an at-home appointment works, what the time is used for, and how to
            prepare.
          </>
        }
      />

      {/* What happens in an appointment */}
      <section className="section bg-white" aria-labelledby="structure-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 id="structure-heading" className="text-3xl sm:text-4xl">
                How a {bookingConfig.slotDurationMinutes}-minute home visit usually runs
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                No two appointments are identical, because no two people are in the same
                situation. That said, most follow a similar shape.
              </p>

              <ul className="mt-8 space-y-5">
                {appointmentStructure.map((item, index) => (
                  <li key={item.title}>
                    <Card className="flex gap-4">
                      <IconChip tone={cardTones[index % cardTones.length]}>
                        <item.icon className="size-6" />
                      </IconChip>
                      <div>
                        <CardTitle as="h3">{item.title}</CardTitle>
                        <CardBody>{item.body}</CardBody>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>

              <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-ink-soft">
                We do not promise a particular outcome, and nothing on this website should be read
                as a guarantee of recovery. What we can offer is unhurried time in a familiar
                setting, a careful conversation and practical, honest guidance.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-28 space-y-6">
                <div className="relative overflow-hidden rounded-4xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-ocean-50 p-7">
                  <AlignmentMotif className="absolute -right-6 bottom-0 h-64 opacity-30" />
                  <div className="relative">
                    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand-800">
                      <Clock className="size-4" aria-hidden="true" />
                      Visit at a glance
                    </p>
                    <dl className="mt-5 space-y-3 text-sm">
                      <div>
                        <dt className="font-medium text-ink-muted">Where</dt>
                        <dd className="text-lg font-semibold text-ink">At your home</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-ink-muted">Length</dt>
                        <dd className="text-lg font-semibold text-ink">
                          {bookingConfig.slotDurationMinutes} minutes
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-ink-muted">Price</dt>
                        <dd className="text-lg font-semibold text-ink">{priceLabel} fixed</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-ink-muted">Booking routes</dt>
                        <dd className="font-semibold text-ink">
                          Online, phone, email or WhatsApp
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-ink-muted">Coverage</dt>
                        <dd className="font-semibold text-ink">
                          {company.primaryServiceArea}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <EmergencyNotice />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service categories */}
      <section className="section layered-bg-soft" aria-labelledby="categories-heading">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">What we work on</p>
            <h2 id="categories-heading" className="mt-4 text-3xl sm:text-4xl">
              At-home physiotherapy support
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              These describe the kinds of visit people book. They are descriptions of how the time
              is used — not diagnoses, and not treatment guarantees.
            </p>
          </div>

          <div className="mt-10">
            <ServiceCards detailed />
          </div>

          <MedicalDisclaimer className="mt-10" />
        </div>
      </section>

      {/* Preparation */}
      <section className="section bg-white" aria-labelledby="prepare-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Getting ready</p>
              <h2 id="prepare-heading" className="mt-4 text-3xl sm:text-4xl">
                Preparing for your home visit
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                Very little is needed, but a few minutes of preparation makes the{' '}
                {bookingConfig.slotDurationMinutes} minutes go further.
              </p>
              <ul className="mt-7 space-y-3">
                {preparationTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                    <span className="leading-relaxed text-ink-soft">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl">Common questions</h2>
              <div className="mt-7">
                <FaqList items={pageFaqs} idPrefix="physio-faq" />
              </div>
              <p className="mt-6">
                <Link
                  href="/faqs"
                  className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                >
                  Read all home physiotherapy FAQs
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <FinalCta location="physiotherapy_final" />
    </>
  );
}
