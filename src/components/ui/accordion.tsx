'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accordion built on Radix primitives, which supply the correct
 * button/region/aria-expanded semantics and keyboard behaviour.
 */

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition data-[state=open]:border-brand-300 data-[state=open]:shadow-card',
        className,
      )}
      {...props}
    />
  );
});

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'group flex min-h-[56px] flex-1 items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink transition hover:bg-brand-50/60 sm:text-lg',
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <Plus
          aria-hidden="true"
          className="size-5 shrink-0 text-brand-700 transition-transform duration-200 group-data-[state=open]:rotate-45 motion-reduce:transition-none"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn('px-5 pb-5 pt-0 leading-relaxed text-ink-soft', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
