import * as React from 'react';
import { ScrollText, Info } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { legalConfig, legalReviewNotice } from '@/config/legal';
import type { Crumb } from '@/components/layout/breadcrumbs';

/**
 * Shared shell for policy pages: consistent heading structure, a visible "last
 * updated" date, the legal-review notice, and readable measure for long text.
 */
export function LegalPage({
  title,
  intro,
  trail,
  children,
  showReviewNotice = true,
}: {
  title: string;
  intro: React.ReactNode;
  trail: Crumb[];
  children: React.ReactNode;
  showReviewNotice?: boolean;
}) {
  return (
    <>
      <PageHeader eyebrow="Policies" title={title} trail={trail} intro={intro}>
        <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <ScrollText className="size-4 text-brand-700" aria-hidden="true" />
          Last updated: {formatDate(legalConfig.lastUpdated)}
        </p>
      </PageHeader>

      <section className="section-tight bg-white">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            {showReviewNotice && (
              <aside
                className="mb-10 rounded-2xl border border-sand-300 bg-sand-50 p-5"
                aria-labelledby="legal-review-notice"
              >
                <h2
                  id="legal-review-notice"
                  className="flex items-center gap-2 text-base font-semibold text-sand-900"
                >
                  <Info className="size-5 shrink-0" aria-hidden="true" />
                  Template — requires legal review
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-sand-900">{legalReviewNotice}</p>
              </aside>
            )}

            <div className="prose-havoheal">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
