import type { Metadata } from 'next';
import Link from 'next/link';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { LegalPage } from '@/components/layout/legal-page';
import { company, mailtoHref } from '@/config/site';

export const metadata: Metadata = metadataFor('/cookie-policy');

export default function CookiePolicyPage() {
  const entry = getPageEntry('/cookie-policy')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/cookie-policy',
            title: entry.title,
            description: entry.description,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Cookie Policy', path: '/cookie-policy' },
          ]),
        )}
      />

      <LegalPage
        title="Cookie Policy"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Cookie Policy', path: '/cookie-policy' },
        ]}
        intro={
          <>
            The cookies and similar technologies used on this website, what each one does, and
            how to control them.
          </>
        }
      >
        <h2>Our approach</h2>
        <p>
          We keep cookies to a minimum. This website sets no advertising cookies, no
          cross-site tracking cookies and no social media cookies. Analytics is switched off by
          default; if it is ever switched on, it will only run after you have chosen to allow it.
        </p>

        <h2>Cookies we use</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Cookie</th>
              <th scope="col">Purpose</th>
              <th scope="col">Type</th>
              <th scope="col">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>havoheal_booking_ref</code>
              </td>
              <td>
                Holds a signed reference to the booking request you have just submitted, so the
                confirmation page can show your details without putting them in the web address.
              </td>
              <td>Strictly necessary</td>
              <td>2 hours</td>
            </tr>
            <tr>
              <td>
                <code>havoheal_consent</code>
              </td>
              <td>
                Remembers your cookie choice so we do not ask again. Only set if analytics is
                configured and you make a choice.
              </td>
              <td>Strictly necessary</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td>Analytics cookies</td>
              <td>
                Help us understand which pages are useful. Not currently in use. If enabled, a
                privacy-friendly provider would be used and only after you consent.
              </td>
              <td>Optional — consent required</td>
              <td>Varies by provider</td>
            </tr>
          </tbody>
        </table>

        <h2>Other browser storage</h2>
        <p>
          The booking form saves a draft of your answers in your browser&rsquo;s local storage so
          that a refresh or an accidental navigation does not lose what you have typed. This is
          not a cookie, it never leaves your device, and it is deleted automatically after a
          short period and as soon as your booking request is submitted. Consent tick-boxes are
          never saved or restored — those must be given deliberately each time.
        </p>

        <h2>Managing cookies</h2>
        <ul>
          <li>
            If a cookie banner is shown, you can choose &ldquo;Essential cookies only&rdquo; and
            no analytics cookies will be set.
          </li>
          <li>
            You can delete cookies at any time through your browser settings, and set your
            browser to block them.
          </li>
          <li>
            Blocking strictly necessary cookies may stop the booking confirmation page from
            showing your details, though your booking request will still have been received.
          </li>
        </ul>

        <h2>Third-party services</h2>
        <p>
          WhatsApp links on this website open WhatsApp directly and do not embed any third-party
          code in these pages. Following such a link takes you to a service with its own privacy
          practices, which we do not control.
        </p>

        <h2>More information</h2>
        <p>
          See our <Link href="/privacy-policy">Privacy Policy</Link> for how we handle personal
          data more generally. If you have any questions, call or message{' '}
          {company.phoneDisplay}, or email <a href={mailtoHref}>{company.email}</a>.
        </p>
      </LegalPage>
    </>
  );
}
