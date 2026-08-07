import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  as: Component = 'div',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { as?: React.ElementType }) {
  return (
    <Component
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-7',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: Component = 'h3',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }) {
  return <Component className={cn('text-lg text-ink sm:text-xl', className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-2 leading-relaxed text-ink-soft', className)} {...props} />;
}

/** Icon chip used at the top of feature cards. */
export function IconChip({
  className,
  tone = 'brand',
  children,
}: {
  className?: string;
  tone?: 'brand' | 'ocean' | 'violet' | 'coral' | 'sand';
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    brand: 'from-brand-500 to-brand-700 text-white',
    ocean: 'from-ocean-500 to-ocean-700 text-white',
    violet: 'from-violetish-500 to-violetish-700 text-white',
    coral: 'from-coral-400 to-coral-600 text-white',
    sand: 'from-sand-400 to-sand-600 text-white',
  };
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
