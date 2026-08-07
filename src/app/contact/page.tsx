import type { Metadata } from 'next';
import { Phone, MessageCircle, Clock, Building2, Mail } from 'lucide-react';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import {
  breadcrumbSchema,
  contactPageSchema,
  jsonLdGraph,
  organizationSchema,
  webPageSchema,
} from '@/lib/structured-data';

import { company, mailtoWithSubject, registeredOffice, telHref, whatsappHref } from '@/config/site';
import { bookingConfig, priceLabel } from '@/config/booking';
import { generateSlots } from '@/lib/slots';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/contact/contact-form';
import { EmergencyNotice, RegisteredOfficeNote } from '@/components/sections/notices';

export const metadata: Metadata = metadataFor('/contact');

export default function ContactPage() {
  const entry = getPageEntry('/contact')!;
  const slots = generateSlots();
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({ path: '/contact', title: entry.title, description: entry.description }),
          contactPageSchema(),
          organizationSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Get in touch"
        title="Contact Havoheal Physiotherapy"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]}
        intro={
          <>
            Contact us to arrange physiotherapy in your own home. Call, message on WhatsApp, email
            us, or use the form below. Whichever route you choose, a{' '}
            {bookingConfig.slotDurationMinutes}-minute home visit costs {priceLabel}.
          </>
        }
      />

      <section className="section-tight bg-white">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Direct contact */}
            <div className="lg:col-span-5">
              <h2 className="text-2xl">Fastest ways to reach us</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">
                Phone and WhatsApp use the same number, so use whichever you find easier.
              </p>

              <div className="mt-6 space-y-3">
                <a
                  href={telHref}
                  className="flex min-h-[64px] items-center gap-4 rounded-2xl border-2 border-brand-700 bg-white px-5 py-4 transition hover:bg-brand-50"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white"
                  >
                    <Phone className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink-muted">Call us</span>
                    <span className="block text-lg font-semibold text-brand-900">
                      {company.phoneDisplay}
                    </span>
                  </span>
                </a>

                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[64px] items-center gap-4 rounded-2xl border-2 border-[#0f7a52] bg-white px-5 py-4 transition hover:bg-emerald-50"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0f7a52] text-white"
                  >
                    <MessageCircle className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink-muted">
                      Message on WhatsApp
                    </span>
                    <span className="block text-lg font-semibold text-[#0b6242]">
                      {company.phoneDisplay}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </span>
                  </span>
                </a>

                {/* Email — the official, monitored business mailbox. */}
                <a
                  href={mailtoWithSubject('Home Physiotherapy Enquiry')}
                  className="flex min-h-[64px] items-center gap-4 rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-600 to-violetish-700 text-white"
                  >
                    <Mail className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-muted">Email</span>
                    <span className="block break-all text-base font-semibold text-ink sm:text-lg">
                      {company.email}
                    </span>
                  </span>
                </a>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Email us about home-visit availability, postcode coverage, an existing booking or
                a general enquiry. Please do not include detailed medical information in an email
                subject line.
              </p>

              <Button asChild size="md" className="mt-4">
                <a href={mailtoWithSubject('Home Physiotherapy Enquiry')}>
                  <Mail aria-hidden="true" />
                  Email Havoheal
                </a>
              </Button>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="flex items-center gap-2 text-lg">
                  <Clock className="size-5 text-brand-700" aria-hidden="true" />
                  Appointment hours
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Home-visit start times run from {firstSlot?.start} to {lastSlot?.start}, with
                  the last visit finishing by {bookingConfig.closingTime}. Each visit lasts{' '}
                  {bookingConfig.slotDurationMinutes} minutes.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Messages sent outside these hours are picked up when we next open. Booking
                  requests submitted through this website are not monitored around the clock.
                </p>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
                <h3 className="flex items-center gap-2 text-lg">
                  <Building2 className="size-5 text-brand-700" aria-hidden="true" />
                  Registered office
                </h3>
                <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
                  {company.legalName}
                  <br />
                  {registeredOffice.line1}
                  <br />
                  {registeredOffice.city}, {registeredOffice.region}
                  <br />
                  {registeredOffice.postcode}
                  <br />
                  Company number {company.companyNumber}
                </address>
                <RegisteredOfficeNote className="mt-4" />
              </div>

              <EmergencyNotice className="mt-6" />
            </div>

            {/* Message form */}
            <div className="lg:col-span-7">
              <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
                <h2 className="text-2xl">Send us a message</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">
                  Use this form for general enquiries. To arrange a home visit for a specific date
                  and time,{' '}
                  <a
                    href="/book-appointment"
                    className="font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4"
                  >
                    book home physiotherapy online
                  </a>{' '}
                  — it is quicker.
                </p>

                <div className="mt-7">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
