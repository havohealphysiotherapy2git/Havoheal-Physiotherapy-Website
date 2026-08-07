import type { Metadata } from 'next';
import Link from 'next/link';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { LegalPage } from '@/components/layout/legal-page';
import { company, mailtoHref, registeredOffice } from '@/config/site';
import { icoDetails, legalConfig } from '@/config/legal';

export const metadata: Metadata = metadataFor('/privacy-policy');

export default function PrivacyPolicyPage() {
  const entry = getPageEntry('/privacy-policy')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/privacy-policy',
            title: entry.title,
            description: entry.description,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Privacy Policy', path: '/privacy-policy' },
          ]),
        )}
      />

      <LegalPage
        title="Privacy Policy"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy-policy' },
        ]}
        intro={
          <>
            How {company.legalName} collects, uses and protects personal data submitted
            through this website, and the rights you have under UK data protection law.
          </>
        }
      >
        <h2>Who we are</h2>
        <p>
          {company.legalName} (company number {company.companyNumber}) is the data
          controller for personal data collected through{' '}
          <span className="whitespace-nowrap">{company.domain}</span>. Our registered office is{' '}
          {registeredOffice.line1}, {registeredOffice.city},{' '}
          {registeredOffice.region}, {registeredOffice.postcode}. That is our registered office
          address, not a clinic — appointments take place at your own home.
        </p>
        <p>
          You can contact us about anything in this policy by calling or messaging{' '}
          {company.phoneDisplay}, or by emailing{' '}
          <a href={mailtoHref}>{company.email}</a>.
        </p>

        <h2>What we collect</h2>
        <h3>When you request a home visit</h3>
        <ul>
          <li>Your full name</li>
          <li>Your phone number and email address</li>
          <li>
            The full address and postcode where the visit should take place, including any flat or
            building name
          </li>
          <li>
            Access and parking details you choose to give us, such as a buzzer code, which
            entrance to use, or where a vehicle can be left
          </li>
          <li>The date and time you have requested</li>
          <li>
            Anything you choose to write in the &ldquo;important message&rdquo; field. We ask you
            not to include detailed medical histories there
          </li>
          <li>A record that you ticked each consent and confirmation box, and when</li>
        </ul>
        <p>
          Because this is a home-visit service, your address is not optional extra information —
          it is what allows the appointment to happen at all. We treat it accordingly: it is
          never shown in a web address, never repeated back in the acknowledgement email we send
          you, and is shared internally only with the person attending.
        </p>

        <h3>When you use the contact form</h3>
        <ul>
          <li>Your name, email address and (optionally) phone number</li>
          <li>The subject and content of your message</li>
        </ul>

        <h3>Technical information</h3>
        <p>
          To protect the booking form from automated abuse we record a one-way hashed
          fingerprint derived from your IP address and browser user agent. We do not store your
          IP address in a readable form, and the hash is not used to identify or profile you.
        </p>

        <h2>Data minimisation</h2>
        <p>
          We ask for the smallest amount of information needed to arrange an appointment. We do
          not request detailed medical histories, health records or special category health data
          through the general booking form. Any clinical information needed for your care is
          discussed with you directly and handled separately from this website.
        </p>

        <h2>Why we use your data, and our lawful basis</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Purpose</th>
              <th scope="col">Lawful basis (UK GDPR Article 6)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Responding to your booking request and arranging an appointment</td>
              <td>
                Steps taken at your request prior to entering into a contract, and performance of
                that contract — Article 6(1)(b)
              </td>
            </tr>
            <tr>
              <td>Replying to an enquiry sent through the contact form</td>
              <td>
                Legitimate interests — responding to people who contact us — Article 6(1)(f)
              </td>
            </tr>
            <tr>
              <td>Keeping records of appointments and consents</td>
              <td>Legal obligation and legitimate interests — Articles 6(1)(c) and 6(1)(f)</td>
            </tr>
            <tr>
              <td>Protecting the website from spam and abuse</td>
              <td>Legitimate interests — keeping our systems secure — Article 6(1)(f)</td>
            </tr>
            <tr>
              <td>Optional analytics cookies</td>
              <td>Your consent — Article 6(1)(a) — which you can withdraw at any time</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Placeholder for legal review:</strong> if any information you provide amounts to
          health data (special category data under Article 9), an additional condition is
          required — typically Article 9(2)(h), the provision of health care by or under the
          responsibility of a professional subject to a duty of confidentiality. Your adviser
          should confirm the correct basis and record it here.
        </p>

        <h2>Who we share it with</h2>
        <p>
          We do not sell your personal data, and we do not share it for marketing. We use a small
          number of service providers who process data on our behalf under written terms:
        </p>
        <ul>
          {legalConfig.processors.map((processor) => (
            <li key={processor.name}>
              <strong>{processor.name}</strong> — {processor.purpose}. {processor.detail}
            </li>
          ))}
        </ul>
        <p>
          We may also disclose information where we are required to do so by law, or where it is
          necessary to protect someone&rsquo;s vital interests.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>
            <strong>Booking records:</strong> {legalConfig.bookingRetentionPeriod} (placeholder —
            confirm with your adviser, taking healthcare record-keeping guidance into account).
          </li>
          <li>
            <strong>Contact form enquiries:</strong> {legalConfig.enquiryRetentionPeriod}.
          </li>
          <li>
            <strong>Abuse-protection fingerprints:</strong> retained with the booking record and
            never used for any other purpose.
          </li>
        </ul>
        <p>
          Retention periods are configurable in the application so they can be adjusted once your
          adviser has confirmed them.
        </p>

        <h2>Where your data is stored</h2>
        <p>
          Our database and hosting are provided by the suppliers listed above. Before launch we
          will confirm the storage region and, where any provider processes data outside the UK,
          the safeguards relied on (such as the UK International Data Transfer Addendum). This
          paragraph must be completed with the actual arrangements before the site goes live.
        </p>

        <h2>Your rights</h2>
        <p>Under UK GDPR you have the right to:</p>
        <ul>
          <li>Ask what personal data we hold about you and get a copy of it</li>
          <li>Ask us to correct information that is wrong or incomplete</li>
          <li>Ask us to delete your data, where there is no overriding reason to keep it</li>
          <li>Ask us to restrict how we use it, or object to our use of it</li>
          <li>Ask for your data in a portable format</li>
          <li>Withdraw consent at any time, where we rely on consent</li>
        </ul>
        <p>
          To exercise any of these rights, contact us using the details above. We will respond
          within one month. Asking us to delete your booking data may mean we can no longer
          provide the appointment.
        </p>

        <h3>How to ask us to delete your data</h3>
        <p>
          Call or message {company.phoneDisplay}, or email{' '}
          <a href={mailtoHref}>{company.email}</a>, quoting your booking reference if you have
          one. We will confirm your identity, delete the records we are not
          required to keep, and confirm in writing what has been removed and what has been
          retained (and why).
        </p>

        <h2>Cookies</h2>
        <p>
          This website uses only the cookies it needs to function, plus optional analytics
          cookies that are never set unless you agree to them. See our{' '}
          <Link href="/cookie-policy">Cookie Policy</Link> for the full list.
        </p>

        <h2>Security</h2>
        <p>
          The website is served over an encrypted connection, submissions are validated on the
          server, the booking form is rate limited and protected against automated abuse, and
          administrative access is restricted and requires authentication. Booking references are
          never placed in web addresses, so your booking details do not appear in browser history,
          referrer headers or server logs.
        </p>

        <h2>Complaints</h2>
        <p>
          If you are unhappy with how we have handled your personal data, please tell us first so
          we can put it right. You also have the right to complain to the{' '}
          <a href={icoDetails.url} target="_blank" rel="noopener noreferrer">
            {icoDetails.name}
          </a>
          <span className="sr-only"> (opens in a new tab)</span>, whose helpline is{' '}
          {icoDetails.helpline}.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We will update this page whenever our processing changes, and the &ldquo;last
          updated&rdquo; date at the top will change with it.
        </p>
      </LegalPage>
    </>
  );
}
