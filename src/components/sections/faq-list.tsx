'use client';

import type { Faq } from '@/config/faqs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * FAQ accordion. Content is plain text so the same strings can be published as
 * FAQPage structured data without markup leaking into the JSON-LD.
 */
export function FaqList({ items, idPrefix = 'faq' }: { items: Faq[]; idPrefix?: string }) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {items.map((faq, index) => (
        <AccordionItem key={faq.question} value={`${idPrefix}-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
