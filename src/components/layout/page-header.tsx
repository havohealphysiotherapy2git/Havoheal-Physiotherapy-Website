import * as React from 'react';
import { Breadcrumbs, type Crumb } from '@/components/layout/breadcrumbs';
import { GradientBlob, DotGrid } from '@/components/graphics/decor';
import { cn } from '@/lib/utils';

/**
 * Shared hero for inner pages. Keeps the H1, intro and breadcrumb structure
 * identical everywhere, which is what makes the heading hierarchy predictable
 * for screen-reader users and for search engines.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  trail,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  trail: Crumb[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('relative overflow-hidden layered-bg', className)}>
      <GradientBlob className="absolute -right-24 -top-40 h-[28rem] w-[28rem] opacity-45" />
      <DotGrid className="absolute inset-x-0 top-0 h-40 text-brand-200/50" />

      <div className="container relative py-10 sm:py-14 lg:py-16">
        <Breadcrumbs trail={trail} />

        <div className="mt-6 max-w-3xl">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h1 className="text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">{title}</h1>
          {intro && (
            <div className="mt-5 text-lg leading-relaxed text-ink-soft">{intro}</div>
          )}
          {children && <div className="mt-7">{children}</div>}
        </div>
      </div>
    </section>
  );
}
