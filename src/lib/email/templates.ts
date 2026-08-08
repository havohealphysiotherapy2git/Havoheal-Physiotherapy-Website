import { company, registeredOffice, telHref, whatsappHref } from '@/config/site';
import { bookingConfig, bookingStatusLabels, type BookingStatus } from '@/config/booking';
import { formatLongDate } from '@/lib/slots';
import { formatPrice } from '@/lib/validation';
import { escapeHtml, textToHtmlParagraphs } from '@/lib/utils';
import type { EmailMessage } from '@/lib/email/provider';

/**
 * Responsive, branded email templates for the home-visit service.
 *
 * Constraints deliberately observed:
 *  - Inline CSS only (Gmail strips <style> in many clients).
 *  - Single column below 600px, no external images, no web fonts.
 *  - Every customer-supplied value is HTML-escaped before interpolation.
 *  - Subject lines carry no health information, no name and no address.
 *  - The customer's acknowledgement shows only the postcode, never the full
 *    address — email previews are visible on lock screens.
 */

export type BookingEmailData = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
  addressFlat?: string | null;
  addressBuilding?: string | null;
  accessInstructions?: string | null;
  parkingInformation?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceInPence: number;
  importantMessage?: string | null;
  status: BookingStatus;
  createdAt?: Date;
};

const BRAND = {
  teal: '#07827e',
  deep: '#0b1728',
  soft: '#5a6b83',
  line: '#e2e8f0',
  bg: '#f4f7fa',
  violet: '#7337ea',
};

/** First name only, for a warmer greeting. Falls back to the whole string. */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

/** Assembles the full visit address from its parts, for internal use only. */
export function formatFullAddress(data: BookingEmailData): string {
  return [data.addressFlat, data.addressBuilding, data.address, data.postcode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

function layout(options: {
  preheader: string;
  heading: string;
  body: string;
  footerNote?: string;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? company.url;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${escapeHtml(options.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.deep};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BRAND.line};">
        <tr>
          <td style="background:linear-gradient(90deg,${BRAND.teal},${BRAND.violet});padding:22px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.2px;">${escapeHtml(company.displayName)}</span>
            <div style="color:#d8fbf7;font-size:13px;margin-top:4px;">Home-visit physiotherapy across ${escapeHtml(company.primaryServiceArea)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:${BRAND.deep};">${escapeHtml(options.heading)}</h1>
            ${options.body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;border-top:1px solid ${BRAND.line};background:#fbfdfe;font-size:12px;line-height:1.6;color:${BRAND.soft};">
            <strong style="color:${BRAND.deep};">${escapeHtml(company.legalName)}</strong><br />
            Phone and WhatsApp: <a href="${telHref}" style="color:${BRAND.teal};">${escapeHtml(company.phoneDisplay)}</a><br />
            Email: <a href="mailto:${company.email}" style="color:${BRAND.teal};">${escapeHtml(company.email)}</a><br />
            Registered office: ${escapeHtml(registeredOffice.line1)}, ${escapeHtml(registeredOffice.city)}, ${escapeHtml(registeredOffice.region)}, ${escapeHtml(registeredOffice.postcode)}<br />
            Company number: ${escapeHtml(company.companyNumber)}<br />
            <span style="display:inline-block;margin-top:6px;">The registered office is not a clinic. Appointments are delivered at customers' homes across ${escapeHtml(company.primaryServiceArea)}, subject to availability.</span>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${BRAND.line};">
              ${options.footerNote ? `${escapeHtml(options.footerNote)}<br />` : ''}
              <a href="${siteUrl}/privacy-policy" style="color:${BRAND.teal};">Privacy Policy</a> ·
              <a href="${siteUrl}/booking-and-cancellation-policy" style="color:${BRAND.teal};">Booking and Cancellation Policy</a>
              <div style="margin-top:8px;color:#8592a6;">This email is not for medical emergencies. Call 999 in an emergency or use NHS 111 when appropriate.</div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:${BRAND.soft};width:42%;">${escapeHtml(label)}</td>
    <td style="padding:9px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:${BRAND.deep};font-weight:600;">${escapeHtml(value)}</td>
  </tr>`;
}

function detailTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border-collapse:collapse;">${rows}</table>`;
}

function statusExplanation(status: BookingStatus): string {
  if (status === 'CONFIRMED') {
    return 'Your home visit is confirmed for the date and time shown above.';
  }
  return `Your request has been received. Your appointment is not fully confirmed until you receive a separate confirmation from ${company.legalName}.`;
}

/** The service line shown to the customer. One service, one price. */
function serviceLabel(data: BookingEmailData): string {
  return `Home physiotherapy visit (${data.durationMinutes} minutes)`;
}

/** The "call or WhatsApp us" button pair, reused by every status email. */
function contactButtons(reference: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="border-radius:10px;background:${BRAND.teal};">
          <a href="${telHref}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Call ${escapeHtml(company.phoneDisplay)}</a>
        </td>
        <td style="width:10px;"></td>
        <td style="border-radius:10px;border:1px solid ${BRAND.teal};">
          <a href="${whatsappHref(`Hello Havoheal Physiotherapy, I would like to talk about booking reference ${reference}.`)}" style="display:inline-block;padding:11px 21px;color:${BRAND.teal};font-size:15px;font-weight:600;text-decoration:none;">Message on WhatsApp</a>
        </td>
      </tr>
    </table>`;
}

/** The change-or-cancel footer paragraph, reused by every status email. */
function changeOrCancelParagraph(siteUrl: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.soft};">
      Need to change or cancel? Call or message us on ${escapeHtml(company.phoneDisplay)}, or email
      <a href="mailto:${company.email}" style="color:${BRAND.teal};">${escapeHtml(company.email)}</a>
      quoting your reference. Please give us as much notice as you can. Full details are in our
      <a href="${siteUrl}/booking-and-cancellation-policy" style="color:${BRAND.teal};">Booking and Cancellation Policy</a>.
    </p>`;
}

/** Shared plain-text sign-off, so every email ends identically. */
function textFooter(siteUrl: string): string[] {
  return [
    '',
    `To change or cancel, call or message ${company.phoneDisplay}, or email ${company.email},`,
    'quoting your reference.',
    `See ${siteUrl}/booking-and-cancellation-policy`,
    '',
    `${company.legalName} — company number ${company.companyNumber}.`,
    `Registered office: ${company.registeredAddress}. This is not a clinic; we come to you.`,
    '',
    'This email is not for medical emergencies. Call 999 in an emergency or use NHS 111 when appropriate.',
  ];
}

// ---------------------------------------------------------------------------
// Customer acknowledgement
// ---------------------------------------------------------------------------

export function buildCustomerAcknowledgement(data: BookingEmailData): EmailMessage {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? company.url;
  const dateLabel = formatLongDate(data.date);
  const timeLabel = `${data.startTime} – ${data.endTime}`;
  const priceLabel = formatPrice(data.priceInPence);
  const isConfirmed = data.status === 'CONFIRMED';

  const rows = [
    detailRow('Booking reference', data.reference),
    detailRow('Requested date', dateLabel),
    detailRow('Requested time', timeLabel),
    detailRow('Duration', `${data.durationMinutes} minutes`),
    detailRow('Price', priceLabel),
    // Postcode only — the full address is never repeated back by email.
    detailRow('Visiting', `Your address in ${data.postcode}`),
    detailRow('Status', bookingStatusLabels[data.status]),
  ].join('');

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Hello ${escapeHtml(firstNameOf(data.fullName))},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Thanks for booking your home physiotherapy visit. ${escapeHtml(statusExplanation(data.status))}</p>
    ${detailTable(rows)}
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Please quote your reference <strong>${escapeHtml(data.reference)}</strong> whenever you contact us about this appointment.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="border-radius:10px;background:${BRAND.teal};">
          <a href="${telHref}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Call ${escapeHtml(company.phoneDisplay)}</a>
        </td>
        <td style="width:10px;"></td>
        <td style="border-radius:10px;border:1px solid ${BRAND.teal};">
          <a href="${whatsappHref(`Hello Havoheal Physiotherapy, I would like to talk about booking reference ${data.reference}.`)}" style="display:inline-block;padding:11px 21px;color:${BRAND.teal};font-size:15px;font-weight:600;text-decoration:none;">Message on WhatsApp</a>
        </td>
      </tr>
    </table>
    <h2 style="margin:24px 0 8px;font-size:16px;color:${BRAND.deep};">Need to change or cancel?</h2>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.soft};">
      Call or message us on ${escapeHtml(company.phoneDisplay)}, or email
      <a href="mailto:${company.email}" style="color:${BRAND.teal};">${escapeHtml(company.email)}</a>
      quoting your reference. Please give us as much notice as you can. Full details are in our
      <a href="${siteUrl}/booking-and-cancellation-policy" style="color:${BRAND.teal};">Booking and Cancellation Policy</a>.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.soft};">For your privacy, we have not repeated your full address or the notes you sent us in this email. We hold those securely with your booking record.</p>
  `;

  const text = [
    `Hello ${firstNameOf(data.fullName)},`,
    '',
    `Thanks for booking your home physiotherapy visit. ${statusExplanation(data.status)}`,
    '',
    `Booking reference: ${data.reference}`,
    `Requested date: ${dateLabel}`,
    `Requested time: ${timeLabel}`,
    `Duration: ${data.durationMinutes} minutes`,
    `Price: ${priceLabel}`,
    `Visiting: your address in ${data.postcode}`,
    `Status: ${bookingStatusLabels[data.status]}`,
    '',
    `To change or cancel, call or message ${company.phoneDisplay}, or email ${company.email},`,
    'quoting your reference.',
    `See ${siteUrl}/booking-and-cancellation-policy`,
    '',
    `${company.legalName} — company number ${company.companyNumber}.`,
    `Registered office: ${company.registeredAddress}. This is not a clinic; we come to you.`,
    '',
    'This email is not for medical emergencies. Call 999 in an emergency or use NHS 111 when appropriate.',
  ].join('\n');

  return {
    to: data.email,
    // No name, address or health information in the subject line.
    subject: `Your home physiotherapy booking request — ${data.reference}`,
    html: layout({
      preheader: `Your booking reference is ${data.reference}.`,
      heading: isConfirmed
        ? 'Your home physiotherapy visit is confirmed'
        : 'Thank you for requesting a home physiotherapy visit',
      body,
      footerNote: 'You are receiving this because you submitted a booking request on our website.',
    }),
    text,
    tag: 'booking-acknowledgement',
  };
}

// ---------------------------------------------------------------------------
// Status-change emails, sent when an administrator acts on a booking
// ---------------------------------------------------------------------------

/**
 * Confirmation: the visit is going ahead at the date and time shown.
 *
 * Distinct from the acknowledgement above, which deliberately says the request
 * is NOT yet confirmed. This is the email the whole booking flow promises.
 */
export function buildBookingConfirmation(data: BookingEmailData): EmailMessage {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? company.url;
  const dateLabel = formatLongDate(data.date);
  const timeLabel = `${data.startTime} – ${data.endTime}`;

  const rows = [
    detailRow('Booking reference', data.reference),
    detailRow('Name', data.fullName),
    detailRow('Service', serviceLabel(data)),
    detailRow('Confirmed date', dateLabel),
    detailRow('Confirmed time', timeLabel),
    detailRow('Duration', `${data.durationMinutes} minutes`),
    detailRow('Price', formatPrice(data.priceInPence)),
    detailRow('Visiting', `Your address in ${data.postcode}`),
    detailRow('Status', bookingStatusLabels.CONFIRMED),
  ].join('');

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Hello ${escapeHtml(firstNameOf(data.fullName))},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Good news — your home physiotherapy visit is now <strong>confirmed</strong>. A physiotherapy professional will travel to you at the date and time below.</p>
    ${detailTable(rows)}
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Please quote your reference <strong>${escapeHtml(data.reference)}</strong> whenever you contact us about this visit.</p>
    ${contactButtons(data.reference)}
    <h2 style="margin:24px 0 8px;font-size:16px;color:${BRAND.deep};">Before the visit</h2>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.soft};">Please clear a space large enough to move around in, and have a firm chair available. Wear comfortable clothing that allows movement. If anything about access or parking has changed, let us know in advance.</p>
    ${changeOrCancelParagraph(siteUrl)}
    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.soft};">For your privacy, we have not repeated your full address or the notes you sent us in this email.</p>
  `;

  const text = [
    `Hello ${firstNameOf(data.fullName)},`,
    '',
    'Good news — your home physiotherapy visit is now CONFIRMED.',
    '',
    `Booking reference: ${data.reference}`,
    `Name: ${data.fullName}`,
    `Service: ${serviceLabel(data)}`,
    `Confirmed date: ${dateLabel}`,
    `Confirmed time: ${timeLabel}`,
    `Duration: ${data.durationMinutes} minutes`,
    `Price: ${formatPrice(data.priceInPence)}`,
    `Visiting: your address in ${data.postcode}`,
    `Status: ${bookingStatusLabels.CONFIRMED}`,
    '',
    'Before the visit: please clear a space large enough to move around in, and',
    'have a firm chair available. Wear comfortable clothing that allows movement.',
    ...textFooter(siteUrl),
  ].join('\n');

  return {
    to: data.email,
    // No name, address or health information in the subject line.
    subject: `Your home physiotherapy visit is confirmed — ${data.reference}`,
    html: layout({
      preheader: `Confirmed for ${dateLabel} at ${data.startTime}.`,
      heading: 'Your home physiotherapy visit is confirmed',
      body,
      footerNote: 'You are receiving this because you booked a home visit with us.',
    }),
    text,
    tag: 'booking-confirmation',
  };
}

/**
 * Reschedule: the visit has moved. The NEW date and time lead, and the previous
 * slot is shown struck through the copy so the change is unmistakable.
 */
export function buildBookingReschedule(
  data: BookingEmailData,
  previous: { date: string; startTime: string } | null,
): EmailMessage {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? company.url;
  const dateLabel = formatLongDate(data.date);
  const timeLabel = `${data.startTime} – ${data.endTime}`;
  const previousLabel = previous
    ? `${formatLongDate(previous.date)} at ${previous.startTime}`
    : null;

  const rows = [
    detailRow('Booking reference', data.reference),
    detailRow('Name', data.fullName),
    detailRow('Service', serviceLabel(data)),
    detailRow('New date', dateLabel),
    detailRow('New time', timeLabel),
    ...(previousLabel ? [detailRow('Previously booked for', previousLabel)] : []),
    detailRow('Duration', `${data.durationMinutes} minutes`),
    detailRow('Price', formatPrice(data.priceInPence)),
    detailRow('Visiting', `Your address in ${data.postcode}`),
    detailRow('Status', bookingStatusLabels.RESCHEDULED),
  ].join('');

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Hello ${escapeHtml(firstNameOf(data.fullName))},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Your home physiotherapy visit has been <strong>moved to a new date and time</strong>. Please check the details below and update any reminders you have set.</p>
    <div style="margin:0 0 18px;padding:14px 16px;border-radius:10px;background:#effcfa;border:1px solid ${BRAND.teal};">
      <div style="font-size:13px;color:${BRAND.soft};">Your visit is now</div>
      <div style="font-size:18px;font-weight:700;color:${BRAND.deep};margin-top:4px;">${escapeHtml(dateLabel)}</div>
      <div style="font-size:18px;font-weight:700;color:${BRAND.deep};">${escapeHtml(timeLabel)}</div>
      ${
        previousLabel
          ? `<div style="font-size:13px;color:${BRAND.soft};margin-top:8px;">Previously ${escapeHtml(previousLabel)}</div>`
          : ''
      }
    </div>
    ${detailTable(rows)}
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">If this new time does not work for you, please tell us as soon as you can and we will find another.</p>
    ${contactButtons(data.reference)}
    ${changeOrCancelParagraph(siteUrl)}
    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.soft};">For your privacy, we have not repeated your full address or the notes you sent us in this email.</p>
  `;

  const text = [
    `Hello ${firstNameOf(data.fullName)},`,
    '',
    'Your home physiotherapy visit has been MOVED to a new date and time.',
    '',
    `NEW DATE: ${dateLabel}`,
    `NEW TIME: ${timeLabel}`,
    ...(previousLabel ? [`Previously booked for: ${previousLabel}`] : []),
    '',
    `Booking reference: ${data.reference}`,
    `Name: ${data.fullName}`,
    `Service: ${serviceLabel(data)}`,
    `Duration: ${data.durationMinutes} minutes`,
    `Price: ${formatPrice(data.priceInPence)}`,
    `Visiting: your address in ${data.postcode}`,
    `Status: ${bookingStatusLabels.RESCHEDULED}`,
    '',
    'If this new time does not work for you, please tell us as soon as you can',
    'and we will find another.',
    ...textFooter(siteUrl),
  ].join('\n');

  return {
    to: data.email,
    subject: `Your home physiotherapy visit has been rescheduled — ${data.reference}`,
    html: layout({
      preheader: `New date: ${dateLabel} at ${data.startTime}.`,
      heading: 'Your visit has been rescheduled',
      body,
      footerNote: 'You are receiving this because you booked a home visit with us.',
    }),
    text,
    tag: 'booking-reschedule',
  };
}

/**
 * Cancellation. The Booking and Cancellation Policy commits to contacting the
 * customer when a visit will not go ahead, so this closes the loop in writing
 * whether the cancellation came from them or from us.
 */
export function buildBookingCancellation(data: BookingEmailData): EmailMessage {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? company.url;
  const dateLabel = formatLongDate(data.date);
  const timeLabel = `${data.startTime} – ${data.endTime}`;

  const rows = [
    detailRow('Booking reference', data.reference),
    detailRow('Name', data.fullName),
    detailRow('Service', serviceLabel(data)),
    detailRow('Cancelled visit', `${dateLabel}, ${timeLabel}`),
    detailRow('Status', bookingStatusLabels.CANCELLED),
  ].join('');

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">Hello ${escapeHtml(firstNameOf(data.fullName))},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">We are writing to confirm that the home physiotherapy visit below has been <strong>cancelled</strong>. You will not be charged for it.</p>
    ${detailTable(rows)}
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.deep};">If this was not what you expected, or you would like to arrange another visit, please get in touch and we will help.</p>
    ${contactButtons(data.reference)}
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.soft};">You can also book a new visit at any time at <a href="${siteUrl}/book-appointment" style="color:${BRAND.teal};">${escapeHtml(company.domain)}</a>.</p>
  `;

  const text = [
    `Hello ${firstNameOf(data.fullName)},`,
    '',
    'We are writing to confirm that the home physiotherapy visit below has been',
    'CANCELLED. You will not be charged for it.',
    '',
    `Booking reference: ${data.reference}`,
    `Name: ${data.fullName}`,
    `Service: ${serviceLabel(data)}`,
    `Cancelled visit: ${dateLabel}, ${timeLabel}`,
    `Status: ${bookingStatusLabels.CANCELLED}`,
    '',
    'If this was not what you expected, or you would like to arrange another',
    'visit, please get in touch and we will help.',
    `Book again: ${siteUrl}/book-appointment`,
    ...textFooter(siteUrl),
  ].join('\n');

  return {
    to: data.email,
    subject: `Your home physiotherapy visit has been cancelled — ${data.reference}`,
    html: layout({
      preheader: `Cancelled: ${dateLabel} at ${data.startTime}.`,
      heading: 'Your visit has been cancelled',
      body,
      footerNote: 'You are receiving this because you booked a home visit with us.',
    }),
    text,
    tag: 'booking-cancellation',
  };
}

// ---------------------------------------------------------------------------
// Business notification
// ---------------------------------------------------------------------------

export function buildBusinessNotification(
  data: BookingEmailData,
  to: string,
): EmailMessage {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? company.url;
  const dateLabel = formatLongDate(data.date);
  const timeLabel = `${data.startTime} – ${data.endTime}`;
  const submittedAt = (data.createdAt ?? new Date()).toISOString().replace('T', ' ').slice(0, 16);

  const rows = [
    detailRow('Reference', data.reference),
    detailRow('Submitted', `${submittedAt} UTC`),
    detailRow('Status', bookingStatusLabels[data.status]),
    detailRow('Visit date', dateLabel),
    detailRow('Visit time', timeLabel),
    detailRow('Duration', `${data.durationMinutes} minutes`),
    detailRow('Price', formatPrice(data.priceInPence)),
    detailRow('Name', data.fullName),
    detailRow('Phone', data.phone),
    detailRow('Email', data.email),
    detailRow('Postcode', data.postcode),
    detailRow('Visit address', formatFullAddress(data)),
    detailRow('Parking', data.parkingInformation?.trim() || 'Not provided'),
  ].join('');

  const access = data.accessInstructions?.trim();
  const message = data.importantMessage?.trim();

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">A new home-visit booking request has been submitted through the website.</p>
    ${detailTable(rows)}

    <h2 style="margin:20px 0 6px;font-size:15px;">Access instructions</h2>
    <div style="font-size:14px;line-height:1.65;color:${BRAND.soft};background:#f8fafc;border:1px solid ${BRAND.line};border-radius:10px;padding:12px 14px;">
      ${access ? textToHtmlParagraphs(access) : '<p style="margin:0;">None provided.</p>'}
    </div>

    <h2 style="margin:20px 0 6px;font-size:15px;">Important message from the customer</h2>
    <div style="font-size:14px;line-height:1.65;color:${BRAND.soft};background:#f8fafc;border:1px solid ${BRAND.line};border-radius:10px;padding:12px 14px;">
      ${message ? textToHtmlParagraphs(message) : '<p style="margin:0;">None provided.</p>'}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;">
      <tr>
        <td style="border-radius:10px;background:${BRAND.teal};">
          <a href="${siteUrl}/admin/bookings" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Open in booking admin</a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;color:${BRAND.soft};">The admin link requires a sign-in. Do not forward this email outside the business — it contains a customer's home address.</p>
  `;

  const text = [
    'New home-visit booking request from the website.',
    '',
    `Reference: ${data.reference}`,
    `Submitted: ${submittedAt} UTC`,
    `Status: ${bookingStatusLabels[data.status]}`,
    `Visit date: ${dateLabel}`,
    `Visit time: ${timeLabel} (${data.durationMinutes} minutes)`,
    `Price: ${formatPrice(data.priceInPence)}`,
    '',
    `Name: ${data.fullName}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Postcode: ${data.postcode}`,
    `Visit address: ${formatFullAddress(data)}`,
    `Parking: ${data.parkingInformation?.trim() || 'Not provided'}`,
    '',
    'Access instructions:',
    access || 'None provided.',
    '',
    'Important message:',
    message || 'None provided.',
    '',
    `Admin: ${siteUrl}/admin/bookings`,
    "Contains a customer's home address — do not forward outside the business.",
  ].join('\n');

  return {
    to,
    // Reference, date and time only: no name, no address, no health information.
    subject: `New home-visit booking request — ${data.reference}`,
    html: layout({
      preheader: `New home-visit request for ${dateLabel} at ${data.startTime}.`,
      heading: 'New home-visit booking request',
      body,
      footerNote: 'Internal notification.',
    }),
    text,
    // Replying goes straight back to the customer.
    replyTo: data.email,
    tag: 'booking-notification',
  };
}

// ---------------------------------------------------------------------------
// Contact enquiry notification
// ---------------------------------------------------------------------------

export function buildContactNotification(
  data: {
    reference: string;
    fullName: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
  },
  to: string,
): EmailMessage {
  const rows = [
    detailRow('Reference', data.reference),
    detailRow('Name', data.fullName),
    detailRow('Email', data.email),
    detailRow('Phone', data.phone || 'Not provided'),
    detailRow('Subject', data.subject),
  ].join('');

  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">A new enquiry has been submitted through the contact form.</p>
    ${detailTable(rows)}
    <div style="font-size:14px;line-height:1.65;color:${BRAND.soft};background:#f8fafc;border:1px solid ${BRAND.line};border-radius:10px;padding:12px 14px;">
      ${textToHtmlParagraphs(data.message)}
    </div>
  `;

  return {
    to,
    subject: `Website enquiry — ${data.reference}`,
    html: layout({
      preheader: `New website enquiry ${data.reference}.`,
      heading: 'New website enquiry',
      body,
      footerNote: 'Internal notification.',
    }),
    text: [
      'New website enquiry.',
      '',
      `Reference: ${data.reference}`,
      `Name: ${data.fullName}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || 'Not provided'}`,
      `Subject: ${data.subject}`,
      '',
      data.message,
    ].join('\n'),
    replyTo: data.email,
    tag: 'contact-notification',
  };
}

/** Acknowledgement sent to someone who used the contact form. */
export function buildContactAcknowledgement(data: {
  reference: string;
  fullName: string;
  email: string;
  subject: string;
}): EmailMessage {
  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">Hello ${escapeHtml(firstNameOf(data.fullName))},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">Thanks for getting in touch. We have received your message and will reply as soon as we can.</p>
    ${detailTable(
      [detailRow('Your reference', data.reference), detailRow('Subject', data.subject)].join(''),
    )}
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">If your enquiry is time sensitive, call or message us on ${escapeHtml(company.phoneDisplay)}.</p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.soft};">We have not repeated the content of your message in this email.</p>
  `;

  return {
    to: data.email,
    subject: `We have received your message — ${data.reference}`,
    html: layout({
      preheader: `Your enquiry reference is ${data.reference}.`,
      heading: 'Thanks for getting in touch',
      body,
      footerNote: 'You are receiving this because you used the contact form on our website.',
    }),
    text: [
      `Hello ${firstNameOf(data.fullName)},`,
      '',
      'Thanks for getting in touch. We have received your message and will reply as soon as we can.',
      '',
      `Your reference: ${data.reference}`,
      `Subject: ${data.subject}`,
      '',
      `If your enquiry is time sensitive, call or message ${company.phoneDisplay}.`,
      `You can also reply to this email or write to ${company.email}.`,
      '',
      'This email is not for medical emergencies. Call 999 in an emergency or use NHS 111 when appropriate.',
    ].join('\n'),
    tag: 'contact-acknowledgement',
  };
}

/** Duration used in emails when a booking record is not to hand. */
export const defaultDurationMinutes = bookingConfig.slotDurationMinutes;
