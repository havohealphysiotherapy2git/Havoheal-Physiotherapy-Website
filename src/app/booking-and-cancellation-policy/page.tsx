import type { Metadata } from 'next';
import Link from 'next/link';

import { metadataFor, getPageEntry } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, jsonLdGraph, webPageSchema } from '@/lib/structured-data';

import { LegalPage } from '@/components/layout/legal-page';
import { company, mailtoHref } from '@/config/site';
import { bookingConfig, priceLabel } from '@/config/booking';
import { legalConfig } from '@/config/legal';
import { generateSlots } from '@/lib/slots';

export const metadata: Metadata = metadataFor('/booking-and-cancellation-policy');

export default function BookingPolicyPage() {
  const entry = getPageEntry('/booking-and-cancellation-policy')!;
  const slots = generateSlots();
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          webPageSchema({
            path: '/booking-and-cancellation-policy',
            title: entry.title,
            description: entry.description,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            {
              name: 'Booking and Cancellation Policy',
              path: '/booking-and-cancellation-policy',
            },
          ]),
        )}
      />

      <LegalPage
        title="Booking and Cancellation Policy"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Booking and Cancellation Policy', path: '/booking-and-cancellation-policy' },
        ]}
        intro={
          <>
            How home-visit booking requests are handled, how appointments are confirmed, and what
            to do if you need to change or cancel.
          </>
        }
      >
        <h2>Requests, not instant confirmations</h2>
        <p>
          When you submit the online booking form you are making a{' '}
          <strong>booking request</strong> for a home visit. You will immediately receive an
          acknowledgement email containing a booking reference. That acknowledgement confirms we
          have received your request — it does not confirm the appointment itself.
        </p>
        <p>
          We then check availability and that we can reach your postcode, and contact you to
          confirm the date and time or to offer an alternative. Your appointment is not fully
          confirmed until you receive that separate confirmation from {company.legalName}. We
          describe it this way because it is accurate: implying an instant confirmation we cannot
          always honour would not be fair to you.
        </p>

        <h2>Visit length, price and hours</h2>
        <ul>
          <li>Every home visit is {bookingConfig.slotDurationMinutes} minutes long.</li>
          <li>The price is a fixed {priceLabel} per visit.</li>
          <li>
            Visit start times run from {firstSlot?.start} to {lastSlot?.start}, with the last
            appointment finishing by {bookingConfig.closingTime}.
          </li>
          <li>
            Online bookings can be made up to {bookingConfig.bookingHorizonDays} days ahead, with
            a minimum of {bookingConfig.minimumNoticeHours} hours&rsquo; notice. For anything
            outside those limits, call or message us.
          </li>
        </ul>

        <h2>How to change or cancel</h2>
        <p>
          Call or message {company.phoneDisplay}, email{' '}
          <a href={mailtoHref}>{company.email}</a>, or reply to your acknowledgement email,
          quoting your booking reference. We do not process changes through the online booking
          form, so that we can be sure we are talking to the right person.
        </p>
        <p>
          Please give us as much notice as you can. Our standard notice period is{' '}
          <strong>{legalConfig.cancellationNoticePeriod}</strong> before the appointment start
          time.
        </p>
        <p>
          <strong>Placeholder — owner to confirm before launch:</strong> whether any charge
          applies to late cancellations or missed appointments, and how much. If a charge does
          apply it must be stated clearly here and be consistent with our{' '}
          <Link href="/terms-and-conditions">Terms and Conditions</Link>.
        </p>

        <h2>If we need to change an appointment</h2>
        <p>
          Occasionally we may need to move an appointment. If that happens we will contact you as
          soon as possible using the details you gave us and offer an alternative time. You will
          not be charged for an appointment we have moved or cancelled.
        </p>

        <h2>Booking statuses</h2>
        <p>Your booking will be in one of these states:</p>
        <table>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pending review</td>
              <td>We have your request and are checking availability.</td>
            </tr>
            <tr>
              <td>Confirmed</td>
              <td>The appointment is agreed for the date and time shown.</td>
            </tr>
            <tr>
              <td>Rescheduled</td>
              <td>The appointment has been moved to a new date or time.</td>
            </tr>
            <tr>
              <td>Cancelled</td>
              <td>The appointment will not go ahead.</td>
            </tr>
            <tr>
              <td>Completed</td>
              <td>The appointment has taken place.</td>
            </tr>
          </tbody>
        </table>

        <h2>Choosing a time</h2>
        <p>
          The time you choose is your <strong>preferred</strong> appointment time, not a live
          reservation. Because we can send more than one physiotherapist out at once, several
          people may request the same time on the same day, and another person&rsquo;s request
          never removes a time from your options.
        </p>
        <p>
          We confirm your visit with you after you submit. If we cannot staff the exact time you
          asked for, we will contact you and offer the nearest alternative rather than simply
          declining the request.
        </p>

        <h2>Access on the day</h2>
        <p>
          Because we come to you, we need to be able to reach you. Please give accurate address,
          access and parking details when you book — a flat number, a buzzer code, which entrance
          to use, or where a vehicle can be left. If we cannot gain access at the booked time, the
          appointment may not be able to go ahead.
        </p>
        <p>
          Visits run to a schedule, so an appointment that starts late will usually still finish
          at its planned time to avoid delaying the person after you.{' '}
          <strong>Placeholder — owner to confirm</strong> how much lateness can be accommodated,
          and what happens if nobody is home at the booked time.
        </p>

        <h2>Coverage</h2>
        <p>
          We visit {company.primaryServiceArea}. Coverage is subject to postcode and appointment
          availability, and we do not promise coverage for every postcode. If you are not sure
          whether we can reach your address, send us your postcode by WhatsApp, call{' '}
          {company.phoneDisplay} or email <a href={mailtoHref}>{company.email}</a> before booking
          — see <Link href="/areas-we-cover">our home-visit coverage area</Link>.
        </p>

        <h2>Emergencies</h2>
        <p>
          <strong>
            This website and booking form are not for medical emergencies. Call 999 in an
            emergency or use NHS 111 when appropriate.
          </strong>{' '}
          Booking requests are not monitored around the clock.
        </p>
      </LegalPage>
    </>
  );
}
