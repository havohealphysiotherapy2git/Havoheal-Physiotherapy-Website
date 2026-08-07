import type { Metadata } from 'next';
import { company, siteConfig } from '@/config/site';

/**
 * Metadata helpers. Every page builds its metadata through `buildMetadata` so
 * canonicals, Open Graph and Twitter cards can never drift out of sync.
 */

/** Canonical origin, environment-aware, always without a trailing slash. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const url = fromEnv && fromEnv.length > 0 ? fromEnv : siteConfig.url;
  return url.replace(/\/+$/, '');
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = '/'): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalised === '/' ? '' : normalised.replace(/\/+$/, '')}`;
}

export type PageMetaInput = {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/physiotherapy". */
  path: string;
  /** Overrides the default social image. */
  ogImage?: string;
  /** Keep pages out of the index (thank-you pages, admin). */
  noindex?: boolean;
  /** Overrides the Open Graph title when the SEO title is long. */
  ogTitle?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const ogTitle = input.ogTitle ?? input.title;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: input.type ?? 'website',
      url,
      siteName: company.displayName,
      title: ogTitle,
      description: input.description,
      locale: 'en_GB',
      ...(input.ogImage ? { images: [{ url: input.ogImage }] } : {}),
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: input.description,
      ...(input.ogImage ? { images: [input.ogImage] } : {}),
    },
  };
}

/**
 * Registry of every indexable page.
 *
 * This single list drives sitemap.xml, the HTML sitemap page and the automated
 * SEO audit (duplicate titles, missing descriptions, orphan pages). Add new
 * pages here when you create them.
 */
export type PageEntry = {
  path: string;
  title: string;
  description: string;
  /** Sitemap priority, 0–1. */
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  group: 'Main pages' | 'Booking and contact' | 'Policies and information';
  /** Short label for the HTML sitemap. */
  label: string;
};

export const pageRegistry: PageEntry[] = [
  {
    path: '/',
    label: 'Home',
    group: 'Main pages',
    title: 'Home Physiotherapy Birmingham | Havoheal Physiotherapy',
    description:
      'Book a 45-minute home physiotherapy visit for £75 with Havoheal Physiotherapy. We come to your home across Birmingham and surrounding areas.',
    priority: 1,
    changeFrequency: 'weekly',
  },
  {
    path: '/physiotherapy',
    label: 'Home Physiotherapy',
    group: 'Main pages',
    title: 'Home-Visit Physiotherapy in Birmingham | Havoheal',
    description:
      'How an at-home physiotherapy appointment works, what the 45 minutes covers and how to prepare. Fixed £75 price across Birmingham and nearby areas.',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/conditions-we-support',
    label: 'Conditions We Support',
    group: 'Main pages',
    title: 'Conditions We Support | Home Physiotherapy Birmingham',
    description:
      'Back, neck, shoulder, hip, knee and mobility concerns people ask us about at home, and when to seek urgent help instead. 45-minute visits for £75.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/areas-we-cover',
    label: 'Areas We Cover',
    group: 'Main pages',
    title: 'Home Physiotherapy Across Birmingham | Areas We Cover',
    description:
      'Explore the Birmingham and surrounding areas covered by Havoheal’s mobile home physiotherapy service. Contact us to confirm your postcode.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/birmingham-physiotherapy',
    label: 'Birmingham Home Physiotherapy',
    group: 'Main pages',
    title: 'Home Visit Physiotherapist Birmingham | 45 Minutes for £75',
    description:
      'A mobile physiotherapist who comes to your home in Birmingham. 45-minute visits at a fixed £75, booked online, by phone, email or WhatsApp.',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/physiotherapy-pricing',
    label: 'Home Physiotherapy Pricing',
    group: 'Main pages',
    title: 'Home Physiotherapy Pricing Birmingham | 45 Minutes for £75',
    description:
      'One fixed price: £75 for a 45-minute home physiotherapy visit. See what is included, what is not, and how travel and payment are handled.',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/about',
    label: 'About Havoheal Physiotherapy UK LTD',
    group: 'Main pages',
    title: 'About Havoheal Physiotherapy UK LTD | Home Visits',
    description:
      'Who we are, why we visit people at home rather than asking them to attend a clinic, and the registered company details behind the service.',
    priority: 0.6,
    changeFrequency: 'monthly',
  },
  {
    path: '/faqs',
    label: 'Frequently Asked Questions',
    group: 'Main pages',
    title: 'Home Physiotherapy FAQs | Havoheal Birmingham',
    description:
      'Answers about home visits, which areas we travel to, the £75 price, travel costs, appointment length, booking by WhatsApp and how confirmation works.',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/book-appointment',
    label: 'Book a Home Visit',
    group: 'Booking and contact',
    title: 'Book a Home Physiotherapy Visit in Birmingham | Havoheal',
    description:
      'Choose a date and time for a £75 home physiotherapy visit across Birmingham and nearby areas. Book online, by phone or through WhatsApp.',
    priority: 0.95,
    changeFrequency: 'weekly',
  },
  {
    path: '/contact',
    label: 'Contact',
    group: 'Booking and contact',
    title: 'Contact Havoheal | Book Home Physiotherapy Birmingham',
    description:
      'Call or WhatsApp +44 7469 334067, or email bookings@havohealphysiotherapy.co.uk to arrange physiotherapy in your own home and confirm postcode coverage.',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/privacy-policy',
    label: 'Privacy Policy',
    group: 'Policies and information',
    title: 'Privacy Policy | Havoheal Physiotherapy UK LTD',
    description:
      'How Havoheal Physiotherapy UK LTD collects, uses, stores and protects the personal data and home addresses submitted through this website, and your UK GDPR rights.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: '/cookie-policy',
    label: 'Cookie Policy',
    group: 'Policies and information',
    title: 'Cookie Policy | Havoheal Physiotherapy UK LTD',
    description:
      'The cookies and similar technologies used on the Havoheal Physiotherapy website, why each one is used, and how you can control them.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: '/terms-and-conditions',
    label: 'Terms and Conditions',
    group: 'Policies and information',
    title: 'Terms and Conditions | Havoheal Physiotherapy UK LTD',
    description:
      'The terms that apply when you use this website and request a home physiotherapy visit from Havoheal Physiotherapy UK LTD.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: '/booking-and-cancellation-policy',
    label: 'Booking and Cancellation Policy',
    group: 'Policies and information',
    title: 'Booking and Cancellation Policy | Havoheal Physiotherapy',
    description:
      'How home-visit booking requests are handled, how appointments are confirmed, and how to change or cancel a 45-minute physiotherapy visit.',
    priority: 0.4,
    changeFrequency: 'yearly',
  },
  {
    path: '/accessibility-statement',
    label: 'Accessibility Statement',
    group: 'Policies and information',
    title: 'Accessibility Statement | Havoheal Physiotherapy',
    description:
      'Our accessibility commitments for this website, the standard we work to, known limitations, and how to tell us about a problem you encounter.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: '/sitemap',
    label: 'Sitemap',
    group: 'Policies and information',
    title: 'Sitemap | Every Page on the Havoheal Physiotherapy Website',
    description:
      'A complete list of pages on the Havoheal Physiotherapy home-visit website, grouped by section for easy navigation.',
    priority: 0.2,
    changeFrequency: 'monthly',
  },
];

export function getPageEntry(path: string): PageEntry | undefined {
  return pageRegistry.find((page) => page.path === path);
}

/** Metadata built straight from the registry, so nothing can drift. */
export function metadataFor(path: string, overrides: Partial<PageMetaInput> = {}): Metadata {
  const entry = getPageEntry(path);
  if (!entry) {
    throw new Error(
      `No page registry entry for "${path}". Add it to pageRegistry in src/lib/seo.ts.`,
    );
  }
  return buildMetadata({
    title: entry.title,
    description: entry.description,
    path: entry.path,
    ...overrides,
  });
}
