import { company, registeredOffice, siteConfig } from '@/config/site';
import { bookingConfig, priceLabel } from '@/config/booking';
import { headlineAreas } from '@/config/areas';
import { services } from '@/config/services';
import { absoluteUrl, getSiteUrl } from '@/lib/seo';
import type { Faq } from '@/config/faqs';

/**
 * JSON-LD builders.
 *
 * RULES — only publish what is factually supported:
 *  - No AggregateRating, Review, Physician, MedicalClinic or credential markup.
 *    None of that is verified, so none of it is emitted.
 *  - The London registered address is published as the organisation address and
 *    is explicitly described as a registered office. Birmingham and surrounding
 *    towns are published as `areaServed` only, never as a business location.
 *  - The service is modelled as a mobile, home-delivered service: the provider
 *    travels to the customer, so there is no place for a visitor address.
 */

type JsonLd = Record<string, unknown>;

const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;
const WEBSITE_ID = `${getSiteUrl()}/#website`;

export function organizationSchema(): JsonLd {
  const profiles = siteConfig.socialProfiles.filter(Boolean);
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: company.displayName,
    legalName: company.legalName,
    url: getSiteUrl(),
    description: siteConfig.description,
    telephone: company.phoneInternational,
    email: company.email,
    // Companies House registration number.
    identifier: {
      '@type': 'PropertyValue',
      name: 'Company number',
      value: company.companyNumber,
    },
    /**
     * Registered office. `description` is carried on the address itself so any
     * consumer of this data sees the qualification, not just human readers of
     * the page.
     */
    address: {
      '@type': 'PostalAddress',
      name: 'Registered office address',
      description:
        'Registered office address only. This is not a clinic and appointments are not delivered here.',
      streetAddress: registeredOffice.line1,
      addressLocality: registeredOffice.city,
      addressRegion: registeredOffice.region,
      postalCode: registeredOffice.postcode,
      addressCountry: registeredOffice.countryCode,
    },
    areaServed: headlineAreas.map((area) => ({
      '@type': 'City',
      name: area,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'West Midlands, England' },
    })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: company.phoneInternational,
        email: company.email,
        contactType: 'customer service',
        areaServed: 'GB',
        availableLanguage: ['English'],
      },
    ],
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: getSiteUrl(),
    name: company.displayName,
    description: siteConfig.description,
    inLanguage: 'en-GB',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function webPageSchema(input: {
  path: string;
  title: string;
  description: string;
}): JsonLd {
  return {
    '@type': 'WebPage',
    '@id': `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.title,
    description: input.description,
    inLanguage: 'en-GB',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
  };
}

/**
 * The home-visit physiotherapy service, with its fixed price and duration.
 *
 * `serviceOutput`/`serviceLocation` are deliberately omitted; instead the
 * service is described as delivered at the customer's own address, which is
 * what `areaServed` plus the description conveys without inventing a venue.
 */
export function serviceSchema(): JsonLd {
  return {
    '@type': 'Service',
    '@id': `${getSiteUrl()}/#home-physiotherapy-service`,
    name: 'Home-visit physiotherapy',
    serviceType: 'Home-visit physiotherapy',
    description: `A ${bookingConfig.slotDurationMinutes}-minute physiotherapy appointment delivered at the customer's own home by ${company.legalName}, at a fixed price of ${priceLabel}, across ${company.primaryServiceArea}.`,
    provider: { '@id': ORGANIZATION_ID },
    areaServed: headlineAreas.map((area) => ({ '@type': 'City', name: area })),
    // How a customer can arrange the service. All three are genuinely offered.
    availableChannel: [
      {
        '@type': 'ServiceChannel',
        name: 'Online booking',
        serviceUrl: absoluteUrl('/book-appointment'),
      },
      {
        '@type': 'ServiceChannel',
        name: 'Telephone booking',
        servicePhone: {
          '@type': 'ContactPoint',
          telephone: company.phoneInternational,
          contactType: 'reservations',
        },
      },
      {
        '@type': 'ServiceChannel',
        name: 'WhatsApp booking',
        serviceUrl: `https://wa.me/${company.whatsappNumber}`,
      },
      {
        '@type': 'ServiceChannel',
        name: 'Email booking',
        serviceUrl: `mailto:${company.email}`,
      },
    ],
    offers: {
      '@type': 'Offer',
      price: (bookingConfig.priceInPence / 100).toFixed(2),
      priceCurrency: bookingConfig.currency,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl('/book-appointment'),
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: (bookingConfig.priceInPence / 100).toFixed(2),
        priceCurrency: bookingConfig.currency,
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: bookingConfig.slotDurationMinutes,
          unitCode: 'MIN',
        },
      },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Home physiotherapy appointment types',
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.title,
          description: service.summary,
        },
      })),
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqPageSchema(items: Pick<Faq, 'question' | 'answer'>[]): JsonLd {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function contactPageSchema(): JsonLd {
  return {
    '@type': 'ContactPage',
    '@id': `${absoluteUrl('/contact')}#contactpage`,
    url: absoluteUrl('/contact'),
    name: `Contact ${company.displayName}`,
    mainEntity: { '@id': ORGANIZATION_ID },
  };
}

/** Wraps one or more schema objects into a single @graph document. */
export function jsonLdGraph(...nodes: JsonLd[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}
