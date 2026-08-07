/**
 * Central business configuration.
 *
 * `company` is the single source of truth for the business identity. Nothing
 * else in the codebase should contain the company name, phone number, email
 * address or registered address as a literal — import from here instead.
 *
 * IMPORTANT — factual accuracy rules for this project:
 *  - The registered office is in London. It is NOT a clinic and customers never
 *    attend it. Appointments are delivered at the customer's own home within
 *    the service area.
 *  - Do not add accreditations, awards, memberships, staff qualifications,
 *    years of experience, review scores or clinic addresses unless the business
 *    owner has supplied verified evidence.
 */

export const company = {
  /** Full registered name. Use in the footer, legal pages, emails and JSON-LD. */
  legalName: 'Havoheal Physiotherapy UK LTD',
  /** Shorter name for headings and navigation, where the full name is excessive. */
  displayName: 'Havoheal Physiotherapy',
  /** Shortest form, for tight spaces such as the mobile logo. */
  shortName: 'Havoheal',

  domain: 'havohealphysiotherapy.co.uk',
  /** Canonical origin. Overridden by NEXT_PUBLIC_SITE_URL at runtime. */
  url: 'https://havohealphysiotherapy.co.uk',

  /** The official, monitored business and booking mailbox. */
  email: 'bookings@havohealphysiotherapy.co.uk',

  phoneDisplay: '+44 7469 334067',
  /** E.164, used for tel: links and structured data. */
  phoneInternational: '+447469334067',
  /** Digits only, no leading plus — the format wa.me expects. */
  whatsappNumber: '447469334067',

  companyNumber: '17089677',

  /** One-line registered office, for compact contexts. */
  registeredAddress: '124–128 City Road, London, England, EC1V 2NX',

  primaryServiceArea: 'Birmingham and surrounding areas',
} as const;

/** Structured form of the registered office, for addresses and JSON-LD. */
export const registeredOffice = {
  line1: '124–128 City Road',
  city: 'London',
  region: 'England',
  postcode: 'EC1V 2NX',
  country: 'United Kingdom',
  countryCode: 'GB',
} as const;

export const siteConfig = {
  name: company.displayName,
  legalName: company.legalName,
  shortName: company.shortName,
  companyNumber: company.companyNumber,
  domain: company.domain,
  url: company.url,

  description: `${company.displayName} brings 45-minute physiotherapy appointments to your home for a fixed £75, across Birmingham and surrounding areas. Book a home visit online, by phone or on WhatsApp.`,

  tagline: 'Home-visit physiotherapy across Birmingham and surrounding areas',

  /** Registered office — NOT a clinic and never described as one. */
  registeredAddress: registeredOffice,

  /** Where appointments are actually delivered. */
  serviceArea: {
    primary: 'Birmingham',
    label: company.primaryServiceArea,
    region: 'West Midlands, England',
  },

  contact: {
    phoneE164: company.phoneInternational,
    phoneDisplay: company.phoneDisplay,
    whatsappNumber: company.whatsappNumber,
    email: company.email,
  },

  whatsappPrefilledMessage:
    'Hello Havoheal Physiotherapy, I would like to enquire about booking a home physiotherapy visit. My postcode is:',

  /**
   * PLACEHOLDER — add real profile URLs once the business owner has created and
   * verified them. Empty entries are not rendered and are not published to
   * structured data.
   */
  socialProfiles: [] as string[],

  /**
   * PLACEHOLDER — set once the Google Business Profile exists. Leave blank to
   * hide the link entirely.
   */
  googleBusinessProfileUrl: '',
  googleMapsAreaUrl:
    'https://www.google.com/maps/search/?api=1&query=Birmingham%2C%20West%20Midlands%2C%20United%20Kingdom',
} as const;

export type NavItem = {
  href: string;
  label: string;
  /**
   * Compact label for the desktop header, where a long one wraps mid-phrase
   * and makes the row look ragged. Everywhere with room — the footer, mobile
   * drawer and sitemap — keeps the fuller `label`.
   */
  shortLabel?: string;
  /** Short description used in the sitemap page and mobile drawer. */
  description?: string;
};

/** Primary navigation. Order here is the order rendered in header and footer. */
export const mainNav: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    description: 'Home-visit physiotherapy across Birmingham and surrounding areas.',
  },
  {
    href: '/physiotherapy',
    label: 'Home Physiotherapy',
    shortLabel: 'Physiotherapy',
    description: 'What happens during a 45-minute physiotherapy visit at your home.',
  },
  {
    href: '/conditions-we-support',
    label: 'Conditions We Support',
    shortLabel: 'Conditions',
    description: 'Movement and musculoskeletal concerns people commonly ask us about.',
  },
  {
    href: '/areas-we-cover',
    label: 'Areas We Cover',
    shortLabel: 'Areas',
    description: 'The Birmingham districts and surrounding towns we visit.',
  },
  {
    href: '/physiotherapy-pricing',
    label: 'Pricing',
    description: 'Fixed £75 price for a 45-minute home visit.',
  },
  { href: '/about', label: 'About', description: 'Who we are and how home visits work.' },
  {
    href: '/faqs',
    label: 'FAQs',
    description: 'Answers about home visits, coverage, pricing and booking.',
  },
  { href: '/contact', label: 'Contact', description: 'Phone, WhatsApp, email and message options.' },
];

/** Secondary pages surfaced in the footer and on the HTML sitemap page. */
export const legalNav: NavItem[] = [
  { href: '/privacy-policy', label: 'Privacy Policy', description: 'How we handle personal data.' },
  { href: '/cookie-policy', label: 'Cookie Policy', description: 'Cookies and similar technologies.' },
  {
    href: '/terms-and-conditions',
    label: 'Terms and Conditions',
    description: 'Terms for using this website and our home-visit service.',
  },
  {
    href: '/booking-and-cancellation-policy',
    label: 'Booking and Cancellation Policy',
    description: 'How home-visit bookings, changes and cancellations work.',
  },
  {
    href: '/accessibility-statement',
    label: 'Accessibility Statement',
    description: 'Our accessibility commitments and known limitations.',
  },
  { href: '/sitemap', label: 'Sitemap', description: 'Every page on this website.' },
];

/** Additional indexable pages that are not in the main navigation. */
export const extraNav: NavItem[] = [
  {
    href: '/birmingham-physiotherapy',
    label: 'Birmingham Home Physiotherapy',
    description: 'Home physiotherapy visits for people in and around Birmingham.',
  },
  {
    href: '/book-appointment',
    label: 'Book a Home Visit',
    description: 'Request a 45-minute home physiotherapy visit in three steps.',
  },
];

export const emergencyNotice =
  'This website and booking form are not for medical emergencies. Call 999 in an emergency or use NHS 111 when appropriate.';

export const medicalDisclaimer =
  'Information on this website is general and is not a substitute for personalised medical advice, diagnosis or treatment. Always speak with a suitably qualified healthcare professional about your own circumstances.';

/** Reused wherever the registered office needs to be distinguished from coverage. */
export const registeredOfficeNotice = `The registered office is not presented as a Birmingham clinic. Appointments are provided at customers' homes within the service area, subject to availability.`;

/** Builds the tel: href used across the site. */
export const telHref = `tel:${company.phoneInternational}`;

/** Builds the mailto: href used across the site. */
export const mailtoHref = `mailto:${company.email}`;

/** mailto: with a prefilled, non-clinical subject line. */
export function mailtoWithSubject(subject: string): string {
  return `mailto:${company.email}?subject=${encodeURIComponent(subject)}`;
}

/** Builds a correctly encoded WhatsApp click-to-chat URL. */
export function whatsappHref(message: string = siteConfig.whatsappPrefilledMessage): string {
  return `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
