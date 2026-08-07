import type { Metadata } from 'next';
import Link from 'next/link';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { LegalPage } from '@/components/layout/legal-page';
import { company, mailtoHref, registeredOffice } from '@/config/site';
import { bookingConfig, priceLabel, travelCostStatement } from '@/config/booking';

export const metadata: Metadata = metadataFor('/terms-and-conditions');

export default function TermsPage() {
  const entry = getPageEntry('/terms-and-conditions')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/terms-and-conditions',
            title: entry.title,
            description: entry.description,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Terms and Conditions', path: '/terms-and-conditions' },
          ]),
        )}
      />

      <LegalPage
        title="Terms and Conditions"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Terms and Conditions', path: '/terms-and-conditions' },
        ]}
        intro={
          <>
            The terms that apply when you use this website and when you request a home
            physiotherapy visit from {company.legalName}.
          </>
        }
      >
        <h2>1. About us</h2>
        <p>
          This website is operated by {company.legalName}, a company registered in England and
          Wales with company number {company.companyNumber}, whose registered office is{' '}
          {registeredOffice.line1}, {registeredOffice.city},{' '}
          {registeredOffice.region}, {registeredOffice.postcode}. The registered office is not a
          clinic and is not somewhere customers attend. We provide home-visit physiotherapy across{' '}
          {company.primaryServiceArea}, subject to postcode and appointment availability.
        </p>

        <h2>2. Using this website</h2>
        <p>
          You may use this website for lawful purposes only. You must not attempt to gain
          unauthorised access to it, submit automated or bulk requests, interfere with its
          operation, or use it to transmit anything unlawful or harmful.
        </p>
        <p>
          We try to keep the website available and accurate but we do not guarantee that it will
          be uninterrupted or error free, and we may change or withdraw any part of it.
        </p>

        <h2>3. Information on this website is general</h2>
        <p>
          Content on this website is general information about our service. It is not medical
          advice, does not diagnose any condition, and is not a substitute for a consultation
          with a suitably qualified healthcare professional. Nothing on this website should be
          read as a promise or guarantee of any particular clinical outcome.
        </p>
        <p>
          <strong>
            This website and its booking form are not for medical emergencies. Call 999 in an
            emergency or use NHS 111 when appropriate.
          </strong>
        </p>

        <h2>4. Booking requests</h2>
        <p>
          Submitting the online form creates a <strong>booking request</strong> for a home visit.
          It is not a confirmed appointment and does not create a binding contract for services.
          You will receive an acknowledgement with a booking reference. We will then check
          availability and postcode coverage and contact you to confirm the visit or to offer an
          alternative time. A contract is formed only when we confirm the appointment with you.
        </p>
        <p>
          You must provide accurate contact details, and an accurate address and access details
          for the visit. We are not responsible for a failure to confirm or attend an appointment
          where the details supplied were incorrect, incomplete or unmonitored, or where access to
          the address could not be gained at the booked time.
        </p>

        <h2>5. Price and payment</h2>
        <p>
          A {bookingConfig.slotDurationMinutes}-minute home physiotherapy visit costs{' '}
          {priceLabel}. This website does not take payments and never asks for card details.
          Payment arrangements are confirmed with you when we contact you about your booking
          request. {travelCostStatement}
        </p>
        <p>
          <strong>Placeholder — owner to complete:</strong> accepted payment methods, when payment
          is due, and any charges for missed appointments (which must also match the{' '}
          <Link href="/booking-and-cancellation-policy">
            Booking and Cancellation Policy
          </Link>
          ).
        </p>

        <h2>6. Changes and cancellations</h2>
        <p>
          How to change or cancel an appointment, and any applicable notice period, are set out
          in our <Link href="/booking-and-cancellation-policy">Booking and Cancellation Policy</Link>
          , which forms part of these terms.
        </p>

        <h2>7. Your responsibilities</h2>
        <ul>
          <li>
            Tell us anything we genuinely need to know in advance for the appointment to go ahead
            safely — but please do not send detailed medical histories through the website.
          </li>
          <li>
            Seek urgent medical help where that is appropriate rather than waiting for an
            appointment.
          </li>
          <li>Treat our team courteously. We may decline or end an appointment where they are not.</li>
        </ul>

        <h2>8. Liability</h2>
        <p>
          Nothing in these terms limits or excludes our liability for death or personal injury
          caused by our negligence, for fraud or fraudulent misrepresentation, or for anything
          else that cannot lawfully be limited or excluded.
        </p>
        <p>
          Subject to that, we are not liable for loss or damage arising from your reliance on
          general information published on this website, or for any indirect or consequential
          loss.
        </p>
        <p>
          <strong>Placeholder for legal review:</strong> your adviser should confirm the wording
          of this clause, and that it is consistent with your professional indemnity insurance and
          with consumer law requirements.
        </p>

        <h2>9. Consumer rights</h2>
        <p>
          Where you are a consumer, you have statutory rights that these terms do not affect,
          including the right to services carried out with reasonable care and skill. Your adviser
          should confirm how the Consumer Contracts Regulations, including any cancellation
          rights for distance contracts, apply to your booking process and record that here.
        </p>

        <h2>10. Intellectual property</h2>
        <p>
          The content, design and graphics of this website belong to {company.legalName} unless
          stated otherwise. You may view and print pages for your own personal use.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the law of England and Wales, and the courts of England and
          Wales have exclusive jurisdiction, unless you live in Scotland or Northern Ireland, in
          which case you may also bring proceedings in your own jurisdiction.
        </p>

        <h2>12. Contact</h2>
        <p>
          Call or message {company.phoneDisplay}, email{' '}
          <a href={mailtoHref}>{company.email}</a>, or use our{' '}
          <Link href="/contact">contact page</Link>.
        </p>
      </LegalPage>
    </>
  );
}
