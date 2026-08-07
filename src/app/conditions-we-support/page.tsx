import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, PhoneCall } from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { conditionGroups, seekUrgentHelpFor } from '@/config/conditions';
import { bookingConfig, priceLabel } from '@/config/booking';

import { PageHeader } from '@/components/layout/page-header';
import { FinalCta } from '@/components/sections/cta';
import { MedicalDisclaimer } from '@/components/sections/notices';
import { Card, CardBody, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = metadataFor('/conditions-we-support');

export default function ConditionsPage() {
  const entry = getPageEntry('/conditions-we-support')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/conditions-we-support',
            title: entry.title,
            description: entry.description,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Conditions We Support', path: '/conditions-we-support' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="What people ask us about"
        title="Conditions and concerns we support"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Conditions We Support', path: '/conditions-we-support' },
        ]}
        intro={
          <>
            These are the kinds of concern people most often bring to a{' '}
            {bookingConfig.slotDurationMinutes}-minute appointment. They are descriptions of what
            people tell us, not diagnoses — and this page is not a promise that physiotherapy is
            the right answer in every case.
          </>
        }
      />

      {/* Urgent help first: safety before marketing. */}
      <section className="border-y border-coral-200 bg-coral-50" aria-labelledby="urgent-heading">
        <div className="container py-10">
          <h2
            id="urgent-heading"
            className="flex items-center gap-2 text-2xl text-coral-900"
          >
            <AlertTriangle className="size-6 shrink-0" aria-hidden="true" />
            When to seek urgent medical help instead
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-coral-950">
            Physiotherapy is not the right first step for everything. Please seek urgent medical
            help rather than booking an appointment with us if you have:
          </p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {seekUrgentHelpFor.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-coral-950">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-coral-600"
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-start gap-2 rounded-2xl border-2 border-coral-300 bg-white p-4 text-sm font-medium text-coral-900">
            <PhoneCall className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>
              This website and booking form are not for medical emergencies. Call 999 in an
              emergency or use NHS 111 when appropriate.
            </span>
          </p>
        </div>
      </section>

      {/* Condition groups */}
      <section className="section bg-white" aria-labelledby="groups-heading">
        <div className="container">
          <h2 id="groups-heading" className="sr-only">
            Concerns people ask us about, grouped by area of the body
          </h2>

          <div className="space-y-14">
            {conditionGroups.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-28">
                <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                  {group.title}
                </h3>
                <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">{group.intro}</p>

                <ul className="mt-6 grid gap-5 md:grid-cols-3">
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <Card as="article" className="h-full card-hover">
                        <CardTitle as="h4" className="text-lg">
                          {item.name}
                        </CardTitle>
                        <CardBody>{item.description}</CardBody>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-2xl">Not sure whether we can help?</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
              If your concern is not listed here, that does not mean an appointment is not
              worthwhile — and equally, we will tell you honestly if we think another service is a
              better fit. A {bookingConfig.slotDurationMinutes}-minute appointment costs{' '}
              {priceLabel} and gives you time to describe the situation properly. You are also
              welcome to{' '}
              <Link
                href="/contact"
                className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
              >
                contact us
              </Link>{' '}
              first and ask.
            </p>
          </div>

          <MedicalDisclaimer className="mt-8" />
        </div>
      </section>

      <FinalCta
        location="conditions_final"
        heading="Talk it through in a 45-minute appointment"
        body="Describe what you have noticed, and we will discuss sensible next steps together."
      />
    </>
  );
}
