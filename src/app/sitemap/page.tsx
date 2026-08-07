import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { metadataFor, getPageEntry, pageRegistry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { PageHeader } from '@/components/layout/page-header';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = metadataFor('/sitemap');

const GROUP_ORDER = ['Main pages', 'Booking and contact', 'Policies and information'] as const;

export default function SitemapPage() {
  const entry = getPageEntry('/sitemap')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({ path: '/sitemap', title: entry.title, description: entry.description }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Sitemap', path: '/sitemap' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Site index"
        title="Sitemap"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Sitemap', path: '/sitemap' },
        ]}
        intro={<>Every page on this website, grouped by section.</>}
      />

      <section className="section-tight bg-white">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            {GROUP_ORDER.map((group) => {
              const pages = pageRegistry.filter((page) => page.group === group);
              if (pages.length === 0) return null;

              return (
                <section
                  key={group}
                  aria-labelledby={`group-${group.replace(/\s+/g, '-').toLowerCase()}`}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
                >
                  <h2
                    id={`group-${group.replace(/\s+/g, '-').toLowerCase()}`}
                    className="text-xl"
                  >
                    {group}
                  </h2>
                  <ul className="mt-5 space-y-4">
                    {pages.map((page) => (
                      <li key={page.path}>
                        <Link
                          href={page.path}
                          className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
                        >
                          {page.label}
                        </Link>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                          {page.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl">For search engines</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              The machine-readable sitemap is available at{' '}
              <a
                href="/sitemap.xml"
                className="inline-flex items-center gap-1 font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
              >
                /sitemap.xml
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>{' '}
              and crawl rules are at{' '}
              <a
                href="/robots.txt"
                className="inline-flex items-center gap-1 font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
              >
                /robots.txt
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              .
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Canonical site address: {absoluteUrl('/')}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
