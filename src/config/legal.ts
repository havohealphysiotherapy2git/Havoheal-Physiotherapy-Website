/**
 * Legal and policy configuration.
 *
 * These templates are drafted to be a sensible, honest starting point for a UK
 * home-visit healthcare business. They are NOT legal advice and must be
 * reviewed by a suitably qualified adviser before launch — see
 * `legalReviewNotice`.
 */

export const legalConfig = {
  /** Update whenever a policy page changes. Shown on every policy page. */
  lastUpdated: '2026-08-06',

  /** Data retention. PLACEHOLDER — confirm with your adviser. */
  bookingRetentionPeriod: '7 years from the date of the appointment',
  enquiryRetentionPeriod: '24 months from the date of your enquiry',

  /** Cancellation notice period. PLACEHOLDER — owner to confirm. */
  cancellationNoticePeriod: '24 hours',

  /**
   * Third-party processors currently in use. Add or remove entries as the
   * stack changes — the Privacy and Cookie policies read from this list.
   */
  processors: [
    {
      name: 'Hosting provider',
      purpose: 'Serving this website and running the booking application',
      detail:
        'PLACEHOLDER — record the hosting provider (for example Vercel) and the region your data is served from once deployment is confirmed.',
      location: 'To be confirmed',
    },
    {
      name: 'Database provider',
      purpose: 'Storing booking requests and enquiries',
      detail:
        'PLACEHOLDER — record the managed PostgreSQL provider and region once provisioned.',
      location: 'To be confirmed',
    },
    {
      name: 'Transactional email provider',
      purpose: 'Sending booking acknowledgements and internal notifications',
      detail:
        'Resend is supported out of the box, sending from bookings@havohealphysiotherapy.co.uk. Record the provider actually configured and the data-processing terms you have accepted.',
      location: 'To be confirmed',
    },
    {
      name: 'Mailbox provider',
      purpose: 'Receiving and storing email sent to bookings@havohealphysiotherapy.co.uk',
      detail:
        'PLACEHOLDER — record the mailbox provider (for example Titan) and where mail is stored. This is separate from the transactional sending provider above.',
      location: 'To be confirmed',
    },
    {
      name: 'Analytics provider',
      purpose: 'Understanding which pages are useful',
      detail:
        'Analytics is disabled by default on this website. If it is switched on, a privacy-friendly, cookie-light provider is used and it only runs after you consent.',
      location: 'Not currently in use',
    },
  ],
} as const;

export const legalReviewNotice =
  'This policy is a template prepared for Havoheal Physiotherapy UK LTD. It is provided for information only, does not constitute legal advice, and should be reviewed by a suitably qualified legal adviser — and updated with the placeholders marked in it — before this website goes live.';

/** ICO details, used in the privacy policy complaints section. */
export const icoDetails = {
  name: "Information Commissioner's Office",
  url: 'https://ico.org.uk/make-a-complaint/',
  helpline: '0303 123 1113',
};
