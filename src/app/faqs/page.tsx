import type { Metadata } from 'next';
import Link from 'next/link';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, faqPageSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { faqCategories, faqs } from '@/config/faqs';
import { company, mailtoHref, telHref } from '@/config/site';

import { PageHeader } from '@/components/layout/page-header';
import { FaqList } from '@/components/sections/faq-list';
import { FinalCta } from '@/components/sections/cta';
import { EmergencyNotice, MedicalDisclaimer } from '@/components/sections/notices';

export const metadata: Metadata = metadataFor('/faqs');

export default function FaqsPage() {
  const entry = getPageEntry('/faqs')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({ path: '/faqs', title: entry.title, description: entry.description }),
          faqPageSchema(faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQs', path: '/faqs' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Answers"
        title="Home physiotherapy FAQs"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/faqs' },
        ]}
        intro={
          <>
            Everything people usually want to know about home visits, the areas we travel to,
            pricing and booking. If your question is not answered here, call or message{' '}
            <a
              href={telHref}
              className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
            >
              {company.phoneDisplay}
            </a>
            , or email{' '}
            <a
              href={mailtoHref}
              className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
            >
              {company.email}
            </a>
            .
          </>
        }
      />

      <section className="section-tight bg-white">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* In-page navigation */}
            <nav aria-label="FAQ categories" className="lg:col-span-3">
              <div className="sticky top-28">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-800">
                  Jump to a section
                </h2>
                <ul className="mt-4 space-y-1.5">
                  {faqCategories.map((category) => (
                    <li key={category}>
                      <a
                        href={`#${slugify(category)}`}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-900"
                      >
                        {category}
                      </a>
                    </li>
                  ))}
                </ul>

                <EmergencyNotice className="mt-6 hidden lg:block" />
              </div>
            </nav>

            <div className="lg:col-span-9">
              <div className="space-y-12">
                {faqCategories.map((category) => (
                  <section
                    key={category}
                    id={slugify(category)}
                    className="scroll-mt-28"
                    aria-labelledby={`${slugify(category)}-heading`}
                  >
                    <h2
                      id={`${slugify(category)}-heading`}
                      className="font-display text-2xl font-semibold text-ink sm:text-3xl"
                    >
                      {category}
                    </h2>
                    <div className="mt-5">
                      <FaqList
                        items={faqs.filter((faq) => faq.category === category)}
                        idPrefix={slugify(category)}
                      />
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <h2 className="text-2xl">Still have a question?</h2>
                <p className="mt-3 leading-relaxed text-ink-soft">
                  Call or message us on {company.phoneDisplay}, email{' '}
                  <a
                    href={mailtoHref}
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    {company.email}
                  </a>
                  , or{' '}
                  <Link
                    href="/contact"
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    send us a message
                  </Link>
                  . If you already know what you need, you can{' '}
                  <Link
                    href="/book-appointment"
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    book home physiotherapy online
                  </Link>
                  .
                </p>
              </div>

              <MedicalDisclaimer className="mt-8" />
              <EmergencyNotice className="mt-6 lg:hidden" />
            </div>
          </div>
        </div>
      </section>

      <FinalCta location="faqs_final" />
    </>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
