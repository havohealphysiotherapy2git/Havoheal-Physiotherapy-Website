import type { Metadata } from 'next';
import Link from 'next/link';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { LegalPage } from '@/components/layout/legal-page';
import { company, mailtoHref } from '@/config/site';

export const metadata: Metadata = metadataFor('/accessibility-statement');

export default function AccessibilityPage() {
  const entry = getPageEntry('/accessibility-statement')!;

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/accessibility-statement',
            title: entry.title,
            description: entry.description,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Accessibility Statement', path: '/accessibility-statement' },
          ]),
        )}
      />

      <LegalPage
        title="Accessibility Statement"
        showReviewNotice={false}
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Accessibility Statement', path: '/accessibility-statement' },
        ]}
        intro={
          <>
            We want everyone to be able to arrange a home physiotherapy visit with us, whatever
            device or assistive technology they use.
          </>
        }
      >
        <h2>The standard we aim for</h2>
        <p>
          This website has been built to meet the{' '}
          <a
            href="https://www.w3.org/TR/WCAG22/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Web Content Accessibility Guidelines (WCAG) 2.2
          </a>
          <span className="sr-only"> (opens in a new tab)</span> at Level AA.
        </p>

        <h2>What we have done</h2>
        <ul>
          <li>
            <strong>Keyboard access.</strong> Every interactive element can be reached and
            operated with a keyboard alone, in a logical order, with a clearly visible focus
            outline that we never remove.
          </li>
          <li>
            <strong>Skip link.</strong> A &ldquo;Skip to main content&rdquo; link is the first
            thing you reach on every page.
          </li>
          <li>
            <strong>Semantic structure.</strong> Pages use real headings in a logical order,
            landmarks for the header, navigation, main content and footer, and lists marked up as
            lists.
          </li>
          <li>
            <strong>Forms.</strong> Every field has a visible label linked to its control. Hints
            and error messages are associated with their fields, errors are summarised at the top
            of the step with links to the field concerned, and problems are never signalled by
            colour alone — there is always an icon and text.
          </li>
          <li>
            <strong>The booking form.</strong> Moving between steps is announced to screen
            readers, focus is moved to the new step, and progress is described in text as well as
            visually. Times are chosen with a native radio group and dates with a native date
            input, so your device&rsquo;s own accessible picker is used.
          </li>
          <li>
            <strong>The mobile menu.</strong> Opening it traps focus inside the drawer, Escape
            closes it, and focus returns to the button that opened it.
          </li>
          <li>
            <strong>Contrast.</strong> Text and interface colours have been chosen to meet the AA
            contrast thresholds, including for placeholder and hint text.
          </li>
          <li>
            <strong>Touch targets.</strong> Buttons, links and form controls are at least 44 by
            44 CSS pixels.
          </li>
          <li>
            <strong>Motion.</strong> Animation is subtle and decorative, and is switched off
            entirely when your device asks for reduced motion. There is no autoplaying video and
            no content that flashes.
          </li>
          <li>
            <strong>Decorative graphics.</strong> The illustrations and patterns on this site are
            hidden from screen readers, because they carry no information that is not also in the
            text.
          </li>
          <li>
            <strong>No pop-ups.</strong> We do not interrupt you with overlays. Any cookie choice
            appears as an inline region you can ignore, and it never covers the call, WhatsApp or
            booking buttons.
          </li>
        </ul>

        <h2>Known limitations</h2>
        <ul>
          <li>
            The native date input is rendered by your browser or operating system, so its exact
            appearance and behaviour vary. Quick-pick buttons for the next available dates are
            provided as an alternative route to the same choice.
          </li>
          <li>
            This statement is based on our own testing during development. A full independent
            audit has not yet been commissioned. If one is carried out, we will publish the
            findings and update this page.
          </li>
        </ul>

        <h2>If something does not work for you</h2>
        <p>
          Please tell us — it helps us fix it, and we can always take your booking another way in
          the meantime. Call or message {company.phoneDisplay}, email{' '}
          <a href={mailtoHref}>{company.email}</a>, or use our{' '}
          <Link href="/contact">contact form</Link>. You can arrange a home visit entirely by
          phone, email or WhatsApp if the online form is not working for you.
        </p>
        <p>
          When you contact us, it helps if you can tell us the page address, what you were trying
          to do, and what device, browser or assistive technology you were using.
        </p>

        <h2>Enforcement</h2>
        <p>
          If you contact us about an accessibility problem and are not happy with our response,
          you can contact the{' '}
          <a
            href="https://www.equalityadvisoryservice.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Equality Advisory and Support Service
          </a>
          <span className="sr-only"> (opens in a new tab)</span>.
        </p>
      </LegalPage>
    </>
  );
}
