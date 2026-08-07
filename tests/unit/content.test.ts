import { describe, expect, it } from 'vitest';

import { pageRegistry } from '@/lib/seo';
import { faqs } from '@/config/faqs';
import {
  areaGroups,
  checkPostcodeCoverage,
  coverageCaveat,
  headlineAreas,
} from '@/config/areas';
import { services } from '@/config/services';
import { company, mailtoHref, siteConfig, telHref, whatsappHref } from '@/config/site';
import { bookingConfig, priceLabel, travelCostStatement } from '@/config/booking';
import { rateLimit, resetRateLimits } from '@/lib/rate-limit';
import { signValue, verifyValue } from '@/lib/signed-value';

/**
 * Content guardrails.
 *
 * These tests exist because the risk on a healthcare site is not just a broken
 * build — it is publishing a claim the business cannot support. They fail the
 * build if forbidden marketing language or an unverifiable claim is introduced.
 */

const FORBIDDEN_CLAIM_PATTERNS: { pattern: RegExp; why: string }[] = [
  { pattern: /guaranteed (recovery|results|relief|cure)/i, why: 'outcome guarantee' },
  { pattern: /\bwe cure\b/i, why: 'cure claim' },
  { pattern: /\b100% success\b/i, why: 'success-rate claim' },
  { pattern: /\bpain[- ]free (guaranteed|in \d)/i, why: 'outcome guarantee' },
  { pattern: /\b\d+(\.\d+)?\s*(star|\/5)\s*(rating|reviews?)/i, why: 'review score' },
  { pattern: /\baward[- ]winning\b/i, why: 'unverified award' },
  { pattern: /\b\d+\+? years (of )?experience\b/i, why: 'unverified experience claim' },
  { pattern: /\bhcpc[- ]registered\b/i, why: 'unverified registration claim' },
  { pattern: /\bour (birmingham )?clinic\b/i, why: 'implies a clinic location' },
  { pattern: /\bvisit (us|our) (clinic|practice|premises)\b/i, why: 'implies customers travel to us' },
  { pattern: /\bcome (in)?to (our|the) (clinic|practice)\b/i, why: 'implies customers travel to us' },
  { pattern: /\bin[- ]clinic appointment/i, why: 'contradicts the home-visit model' },
  { pattern: /\bwe cover every postcode\b/i, why: 'over-promises coverage' },
  { pattern: /\bHavoheal Healthcare\b/, why: 'superseded company name' },
  { pattern: /\bhello@|\binfo@|\bcontact@|example@example\.com/i, why: 'obsolete or placeholder email' },
  { pattern: /\blorem ipsum\b/i, why: 'placeholder filler text' },
];

function collectContentStrings(): { source: string; text: string }[] {
  const entries: { source: string; text: string }[] = [];

  for (const faq of faqs) {
    entries.push({ source: `faq:${faq.question}`, text: faq.question });
    entries.push({ source: `faq:${faq.question}`, text: faq.answer });
  }
  for (const service of services) {
    entries.push({ source: `service:${service.slug}`, text: service.title });
    entries.push({ source: `service:${service.slug}`, text: service.summary });
    entries.push({ source: `service:${service.slug}`, text: service.detail });
    for (const item of service.includes) {
      entries.push({ source: `service:${service.slug}`, text: item });
    }
  }
  for (const page of pageRegistry) {
    entries.push({ source: `meta:${page.path}`, text: page.title });
    entries.push({ source: `meta:${page.path}`, text: page.description });
  }
  entries.push({ source: 'site', text: siteConfig.description });
  entries.push({ source: 'site', text: siteConfig.tagline });

  return entries;
}

describe('content safety', () => {
  it('contains no unsupported medical or marketing claims', () => {
    const failures: string[] = [];
    for (const entry of collectContentStrings()) {
      for (const rule of FORBIDDEN_CLAIM_PATTERNS) {
        if (rule.pattern.test(entry.text)) {
          failures.push(`${entry.source} — ${rule.why}: "${entry.text}"`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('always qualifies the London address as a registered office, never a clinic', () => {
    const mentions = collectContentStrings().filter((entry) =>
      /city road/i.test(entry.text),
    );

    // The address is allowed to appear, but only alongside the qualification.
    expect(mentions.length).toBeGreaterThan(0);
    for (const entry of mentions) {
      expect(entry.text, entry.source).toMatch(/registered (office|address)/i);
      // A positive claim of a clinic or visitor address is never permitted.
      expect(entry.text, entry.source).not.toMatch(
        /(our|the) clinic (is )?(at|in)|visit us at|our premises|walk[- ]in/i,
      );
    }
  });

  it('describes submissions as booking requests, not confirmed bookings', () => {
    const confirmationFaq = faqs.find((faq) =>
      faq.question.includes('Is submitting the form a confirmed appointment'),
    );
    expect(confirmationFaq).toBeDefined();
    expect(confirmationFaq?.answer).toMatch(/booking request/i);
    expect(confirmationFaq?.answer).toMatch(/not fully confirmed/i);
    expect(confirmationFaq?.answer).not.toMatch(/instantly confirmed|guaranteed slot/i);
  });

  it('states the price and duration consistently', () => {
    expect(priceLabel).toBe('£75');
    expect(bookingConfig.slotDurationMinutes).toBe(45);

    const priceFaq = faqs.find((faq) => faq.category === 'Pricing');
    expect(priceFaq?.answer).toContain('£75');
  });
});

describe('company identity', () => {
  it('uses the correct registered name and official email everywhere', () => {
    expect(company.legalName).toBe('Havoheal Physiotherapy UK LTD');
    expect(company.displayName).toBe('Havoheal Physiotherapy');
    expect(company.email).toBe('bookings@havohealphysiotherapy.co.uk');
    expect(company.companyNumber).toBe('17089677');
    expect(company.phoneInternational).toBe('+447469334067');
    expect(company.domain).toBe('havohealphysiotherapy.co.uk');
  });

  it('derives every contact link from the central config', () => {
    expect(telHref).toBe('tel:+447469334067');
    expect(mailtoHref).toBe('mailto:bookings@havohealphysiotherapy.co.uk');
    expect(whatsappHref()).toContain('https://wa.me/447469334067?text=');
  });

  it('prefills the WhatsApp message with a home-visit enquiry and postcode prompt', () => {
    const decoded = decodeURIComponent(whatsappHref().split('text=')[1] ?? '');
    expect(decoded).toContain('home physiotherapy visit');
    expect(decoded).toContain('postcode');
  });

  it('never exposes a webmail or mailbox-management URL', () => {
    const surfaces = [
      siteConfig.description,
      siteConfig.tagline,
      company.url,
      ...pageRegistry.map((page) => page.description),
    ];
    for (const surface of surfaces) {
      expect(surface).not.toMatch(/titan|webmail|mail\.[a-z]+\/login/i);
    }
  });
});

describe('home-visit positioning', () => {
  it('leads with the home-visit service in the site description and tagline', () => {
    expect(siteConfig.description).toMatch(/home|comfort of your/i);
    expect(siteConfig.tagline).toMatch(/home-visit/i);
  });

  it('makes home visits clear in the titles or descriptions of key pages', () => {
    const keyPages = ['/', '/physiotherapy', '/book-appointment', '/areas-we-cover'];
    for (const path of keyPages) {
      const page = pageRegistry.find((entry) => entry.path === path);
      expect(page, `${path} must be registered`).toBeDefined();
      expect(
        `${page!.title} ${page!.description}`,
        `${path} should communicate the home-visit service`,
      ).toMatch(/home|at your home|mobile|we come to you/i);
    }
  });

  it('answers the home-visit questions people actually ask', () => {
    const required = [
      'Do you provide physiotherapy at home?',
      'Which areas do you visit?',
      'Is travel included in the £75 price?',
      'What happens during a home physiotherapy appointment?',
      'Do I need to prepare anything before the visit?',
      'How do I confirm whether my postcode is covered?',
      'Do you operate from a Birmingham clinic?',
      'How long does a home visit last?',
      'Can I book by WhatsApp?',
      'Is submitting the form a confirmed appointment?',
    ];
    const questions = faqs.map((faq) => faq.question);
    for (const question of required) {
      expect(questions, `missing FAQ: ${question}`).toContain(question);
    }
  });

  it('makes no claim about travel costs until the owner confirms it', () => {
    const travelFaq = faqs.find((faq) => faq.question.includes('Is travel included'));
    expect(travelFaq?.answer).toBe(travelCostStatement);

    if (bookingConfig.travelIncludedInPrice === null) {
      // Unconfirmed: the copy must not assert either way.
      expect(travelCostStatement).not.toMatch(/travel is included|travel is not included/i);
      expect(travelCostStatement).toMatch(/confirm/i);
    }
  });

  it('never promises coverage of every postcode', () => {
    expect(coverageCaveat).toMatch(/subject to postcode/i);
    const coverageFaq = faqs.find((faq) => faq.question === 'Which areas do you visit?');
    expect(coverageFaq?.answer).toMatch(/subject to|confirm/i);
  });
});

describe('postcode coverage check', () => {
  it('recognises postcodes inside the service area', () => {
    for (const postcode of ['B15 2TT', 'b152tt', 'WV1 1AA', 'WS13 6AA', 'DY8 1AA']) {
      expect(checkPostcodeCoverage(postcode), postcode).toBe('likely-covered');
    }
  });

  it('asks the visitor to check with us when the area is outside our usual patch', () => {
    for (const postcode of ['M1 1AE', 'EC1V 2NX', 'LS1 4DY']) {
      expect(checkPostcodeCoverage(postcode), postcode).toBe('check-with-us');
    }
  });

  it('rejects anything that is not a UK postcode', () => {
    for (const value of ['', 'hello', 'B15', '12345', 'B15 2T']) {
      expect(checkPostcodeCoverage(value), value).toBe('invalid');
    }
  });
});

describe('page registry', () => {
  it('has unique paths, titles and descriptions', () => {
    const paths = pageRegistry.map((page) => page.path);
    const titles = pageRegistry.map((page) => page.title);
    const descriptions = pageRegistry.map((page) => page.description);

    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('includes every required indexable page', () => {
    const required = [
      '/',
      '/physiotherapy',
      '/conditions-we-support',
      '/areas-we-cover',
      '/birmingham-physiotherapy',
      '/physiotherapy-pricing',
      '/about',
      '/book-appointment',
      '/contact',
      '/faqs',
      '/privacy-policy',
      '/cookie-policy',
      '/terms-and-conditions',
      '/booking-and-cancellation-policy',
      '/accessibility-statement',
      '/sitemap',
    ];
    const paths = new Set(pageRegistry.map((page) => page.path));
    for (const path of required) {
      expect(paths.has(path), `${path} must be registered`).toBe(true);
    }
  });
});

describe('service areas', () => {
  it('includes every headline town somewhere in the grouped lists', () => {
    const all = new Set(areaGroups.flatMap((group) => group.areas));
    const missing = headlineAreas.filter(
      (area) => !all.has(area) && area !== 'Birmingham',
    );
    expect(missing).toEqual([]);
  });

  it('lists Birmingham districts', () => {
    const birmingham = areaGroups.find((group) => group.id === 'birmingham');
    expect(birmingham?.areas).toContain('Edgbaston');
    expect(birmingham?.areas).toContain('Sutton Coldfield');
  });
});

describe('rate limiting', () => {
  it('allows requests up to the limit and blocks beyond it', () => {
    resetRateLimits();
    const key = 'test:bucket';
    for (let i = 0; i < 3; i += 1) {
      expect(rateLimit(key, 3, 60).success).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keys buckets independently', () => {
    resetRateLimits();
    expect(rateLimit('a', 1, 60).success).toBe(true);
    expect(rateLimit('b', 1, 60).success).toBe(true);
    expect(rateLimit('a', 1, 60).success).toBe(false);
  });
});

describe('signed values', () => {
  it('round-trips a value', () => {
    const token = signValue('HH-ABC123', 60);
    expect(verifyValue(token)).toBe('HH-ABC123');
  });

  it('rejects a tampered token', () => {
    const token = signValue('HH-ABC123', 60);
    const tampered = token.replace(/^[^.]+/, 'SEFWLUZBS0U');
    expect(verifyValue(tampered)).toBeNull();
  });

  it('rejects an expired token', () => {
    expect(verifyValue(signValue('HH-ABC123', -1))).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(verifyValue('')).toBeNull();
    expect(verifyValue('not-a-token')).toBeNull();
    expect(verifyValue(undefined)).toBeNull();
  });
});
