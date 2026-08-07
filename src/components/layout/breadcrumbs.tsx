import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Crumb = { name: string; path: string };

/**
 * Breadcrumb trail. The final item is the current page and is marked with
 * aria-current rather than being a link, so it is announced correctly.
 */
export function Breadcrumbs({
  trail,
  className,
  tone = 'light',
}: {
  trail: Crumb[];
  className?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    'size-4 shrink-0',
                    tone === 'dark' ? 'text-slate-500' : 'text-slate-400',
                  )}
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className={cn(
                    'font-semibold',
                    tone === 'dark' ? 'text-white' : 'text-ink',
                  )}
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className={cn(
                    'rounded px-1 py-0.5 underline decoration-transparent underline-offset-4 transition hover:decoration-current',
                    tone === 'dark'
                      ? 'text-slate-300 hover:text-white'
                      : 'text-ink-muted hover:text-brand-800',
                  )}
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
