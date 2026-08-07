import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, Clock, ShieldCheck, Info, House, Mail } from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import {
  breadcrumbSchema,
  jsonLdGraph,
  organizationSchema,
  webPageSchema,
} from '@/lib/structured-data';

import { company, mailtoHref, registeredOfficeNotice } from '@/config/site';
import { bookingConfig, priceLabel } from '@/config/booking';

import { PageHeader } from '@/components/layout/page-header';
import { FinalCta } from '@/components/sections/cta';
import { MedicalDisclaimer, OwnerPlaceholder } from '@/components/sections/notices';
import { Card, CardBody, CardTitle, IconChip } from '@/components/ui/card';

export const metadata: Metadata = metadataFor('/about');

const principleTones = ['brand', 'coral', 'violet', 'ocean'] as const;

const principles = [
  {
    icon: House,
    title: 'We come to you',
    body: 'Rather than asking people to attend a clinic, we travel to their home. For anyone whose difficulty is partly the journey itself — a painful knee, a bus route, hospital parking — that removes the barrier rather than adding to it.',
  },
  {
    icon: Clock,
    title: 'Time to talk properly',
    body: `Every visit is ${bookingConfig.slotDurationMinutes} minutes. That is a deliberate choice: rushed appointments make it hard to understand what is actually going on for someone.`,
  },
  {
    icon: ShieldCheck,
    title: 'Honest about what we can and cannot say',
    body: 'We do not promise recoveries, publish invented statistics, or claim credentials we have not evidenced. If another service is a better fit for you, we will say so.',
  },
  {
    icon: MapPin,
    title: 'Clear about where we work',
    body: 'Birmingham and the surrounding towns are where we travel. Our registered office is in London, it is not a clinic, and nobody attends it — we say that plainly rather than implying a local address.',
  },
];

export default function AboutPage() {
  const entry = getPageEntry('/about')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({ path: '/about', title: entry.title, description: entry.description }),
          organizationSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="About us"
        title="About Havoheal Physiotherapy UK LTD"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
        intro={
          <>
            {company.legalName} provides {bookingConfig.slotDurationMinutes}-minute physiotherapy
            visits at a fixed {priceLabel} — delivered at your home, across{' '}
            {company.primaryServiceArea}, rather than requiring you to attend a clinic.
          </>
        }
      />

      <section className="section bg-white" aria-labelledby="how-we-work">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 id="how-we-work" className="text-3xl sm:text-4xl">
                How we work
              </h2>
              <div className="prose-havoheal mt-5">
                <p>
                  {company.legalName} exists to make physiotherapy straightforward to arrange and
                  easy to understand. One appointment length. One price. Four ways to book —
                  online, by phone, by email or on WhatsApp — with no difference in what you get.
                </p>
                <p>
                  The part that makes the biggest difference to most people is that{' '}
                  <strong>we travel to you</strong>. There is no clinic to attend, no parking to
                  find and no waiting room. That matters practically — if getting about is part of
                  the problem, a clinic appointment adds to it — and it makes the appointment
                  better: we can look at your actual stairs, your actual chair, the doorway you
                  actually catch your shoulder on.
                </p>
                <p>
                  We publish our price openly because guessing what an appointment will cost is
                  one of the most common reasons people put off getting in touch. A{' '}
                  {bookingConfig.slotDurationMinutes}-minute home visit costs {priceLabel}, and
                  the only extras are the ones listed on our{' '}
                  <Link href="/physiotherapy-pricing">home-visit pricing page</Link>.
                </p>
                <p>
                  When you submit a booking request, you get an acknowledgement with a reference
                  immediately, and we then contact you to confirm the visit or offer an
                  alternative time. We describe that as a request rather than a confirmed booking
                  because that is what it is until we have checked the diary and your postcode.
                </p>
              </div>

              <ul className="mt-9 space-y-5">
                {principles.map((principle, index) => (
                  <li key={principle.title}>
                    <Card className="flex gap-4">
                      <IconChip tone={principleTones[index % principleTones.length]}>
                        <principle.icon className="size-6" />
                      </IconChip>
                      <div>
                        <CardTitle as="h3">{principle.title}</CardTitle>
                        <CardBody>{principle.body}</CardBody>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-28 space-y-6">
                <Card>
                  <CardTitle as="h2" className="flex items-center gap-2">
                    <Building2 className="size-5 text-brand-700" aria-hidden="true" />
                    Company details
                  </CardTitle>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div>
                      <dt className="font-medium text-ink-muted">Registered name</dt>
                      <dd className="font-semibold text-ink">{company.legalName}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink-muted">Company number</dt>
                      <dd className="font-semibold text-ink">{company.companyNumber}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink-muted">Registered office address</dt>
                      <dd className="font-semibold text-ink">{company.registeredAddress}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink-muted">Where appointments happen</dt>
                      <dd className="font-semibold text-ink">
                        At your home, across {company.primaryServiceArea}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink-muted">Phone and WhatsApp</dt>
                      <dd className="font-semibold text-ink">{company.phoneDisplay}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink-muted">Email</dt>
                      <dd className="font-semibold text-ink">
                        <a
                          href={mailtoHref}
                          className="inline-flex items-center gap-1.5 break-all underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                        >
                          <Mail className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
                          {company.email}
                        </a>
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-ink-muted">
                    {registeredOfficeNotice}
                  </p>
                </Card>

                <div className="rounded-3xl border border-sand-300 bg-sand-50 p-6">
                  <h2 className="flex items-center gap-2 text-lg text-sand-900">
                    <Info className="size-5 shrink-0" aria-hidden="true" />
                    To be added by the business owner
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-sand-900">
                    This page deliberately contains no claims about qualifications, regulatory
                    registrations, professional memberships, awards or years of experience,
                    because none have been supplied and verified.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-sand-900">
                    {[
                      'Practitioner names and their HCPC registration numbers',
                      'Professional body memberships (for example the CSP)',
                      'Insurance details',
                      'Photographs of the team',
                      'Years of experience and areas of special interest',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sand-600"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-sand-900/80">
                    <OwnerPlaceholder>Note:</OwnerPlaceholder> add these only once you can
                    evidence them. Publishing unverified healthcare credentials is both an
                    advertising and a regulatory risk.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <MedicalDisclaimer className="mt-12" />
        </div>
      </section>

      <FinalCta location="about_final" />
    </>
  );
}
