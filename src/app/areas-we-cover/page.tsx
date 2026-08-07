import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ExternalLink } from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, serviceSchema, webPageSchema } from '@/lib/structured-data';

import { areaGroups, areaPhrases, coverageCaveat, headlineAreas } from '@/config/areas';
import { company, siteConfig } from '@/config/site';

import { PageHeader } from '@/components/layout/page-header';
import { FinalCta } from '@/components/sections/cta';
import { CoverageCallout, RegisteredOfficeNote } from '@/components/sections/notices';
import { PostcodeChecker } from '@/components/sections/postcode-checker';

export const metadata: Metadata = metadataFor('/areas-we-cover');

export default function AreasPage() {
  const entry = getPageEntry('/areas-we-cover')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/areas-we-cover',
            title: entry.title,
            description: entry.description,
          }),
          serviceSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Areas We Cover', path: '/areas-we-cover' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Home-visit coverage"
        title="Home Physiotherapy Across Birmingham and Surrounding Areas"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Areas We Cover', path: '/areas-we-cover' },
        ]}
        intro={
          <>
            {company.displayName} provides home-visit physiotherapy across Birmingham and
            surrounding areas. The lists below set out the districts and towns we travel to inside
            our marked service boundary.
          </>
        }
      />

      {/* Headline towns */}
      <section className="border-b border-slate-200 bg-white" aria-labelledby="headline-heading">
        <div className="container py-10">
          <h2 id="headline-heading" className="text-xl">
            Main towns and areas we visit
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {headlineAreas.map((area) => (
              <li
                key={area}
                className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-900"
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                <span className="sr-only">{areaPhrases[area] ?? `Home physiotherapy in ${area}`}</span>
                <span aria-hidden="true">{area}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-muted">{coverageCaveat}</p>
        </div>
      </section>

      {/* Grouped coverage */}
      <section className="section layered-bg-soft" aria-labelledby="groups-heading">
        <div className="container">
          <h2 id="groups-heading" className="sr-only">
            Coverage by area
          </h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {areaGroups.map((group) => (
              <section
                key={group.id}
                id={group.id}
                className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-7"
              >
                <h3 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  {group.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{group.intro}</p>
                <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {group.areas.map((area) => (
                    <li
                      key={`${group.id}-${area}`}
                      className="flex items-start gap-2 text-sm text-ink-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500"
                      />
                      {area}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-ink-muted">
            We also visit surrounding Birmingham neighbourhoods and nearby communities within the
            marked service boundary that are not individually listed above. We do not promise
            coverage for every postcode — ask us and we will give you a straight answer.
          </p>

          <div className="mt-8">
            <PostcodeChecker id="areas-postcode-checker" />
          </div>

          <CoverageCallout className="mt-6" />

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
            <h2 className="text-xl">Where we are registered</h2>
            <RegisteredOfficeNote className="mt-3" />
            {siteConfig.googleMapsAreaUrl && (
              <p className="mt-4">
                <a
                  href={siteConfig.googleMapsAreaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                >
                  View the Birmingham area on Google Maps
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            )}
            <p className="mt-4 text-sm text-ink-muted">
              Looking specifically for Birmingham?{' '}
              <Link
                href="/birmingham-physiotherapy"
                className="font-medium text-brand-800 underline decoration-brand-300 underline-offset-4"
              >
                Book home physiotherapy in Birmingham
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <FinalCta
        location="areas_final"
        heading="Book a 45-minute home visit in your area"
        body="Choose a time that suits you, or send us your postcode and we will confirm we can reach you first."
      />
    </>
  );
}
