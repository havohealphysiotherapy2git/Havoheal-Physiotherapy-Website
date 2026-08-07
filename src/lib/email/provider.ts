import 'server-only';
import { getServerEnv } from '@/lib/env';
import { company } from '@/config/site';

/**
 * Email provider abstraction.
 *
 * The application never talks to a vendor SDK directly. Swap providers by
 * adding a case here and changing EMAIL_PROVIDER — no other file changes.
 *
 * Providers:
 *   console — logs a redacted summary. The default, and what runs in
 *             development and CI so no real email is ever sent by accident.
 *   resend  — sends via Resend when RESEND_API_KEY is set.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Non-sensitive tag used for delivery analytics. */
  tag?: string;
};

/**
 * Short, stable error codes. Deliberately coarse: a raw provider message could
 * echo back a customer's email address or part of the payload, and it is stored
 * on the booking record.
 */
export type EmailErrorCode =
  | 'invalid_recipient'
  | 'invalid_header'
  | 'provider_rejected'
  | 'provider_unreachable'
  | 'not_configured'
  | 'unknown';

export type EmailResult =
  | { ok: true; id: string | null; provider: string; skipped?: boolean }
  | { ok: false; code: EmailErrorCode; provider: string };

/** Masks an address for logs: "someone@example.com" → "s******@example.com". */
export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  return `${head}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
}

/**
 * Rejects anything that could be used for SMTP header injection.
 *
 * Customer-supplied values reach the subject line and the reply-to address, so
 * a CR or LF must never survive into a header. This is belt and braces on top
 * of Zod stripping control characters at the form boundary.
 */
const HEADER_UNSAFE = /[\u0000-\u001F\u007F]/;

export function isHeaderSafe(value: string): boolean {
  return !HEADER_UNSAFE.test(value);
}

/** Collapses any header-unsafe characters to a space. */
export function sanitiseHeader(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/** A single, permissive-but-real address check used before we call a provider. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

export function isSendableAddress(value: string): boolean {
  return EMAIL_SHAPE.test(value) && isHeaderSafe(value) && value.length <= 254;
}

/**
 * The From address, always on the verified sending domain.
 *
 * User input can never influence this: it comes from the environment or falls
 * back to the configured company mailbox.
 */
export function getFromAddress(): string {
  return (
    process.env.BOOKING_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    `${company.displayName} <${company.email}>`
  );
}

/** Where replies should go. Never derived from user input. */
export function getReplyToAddress(): string {
  return process.env.BOOKING_REPLY_TO_EMAIL ?? company.email;
}

/** Where new booking requests and enquiries are sent internally. */
export function getBusinessNotificationAddress(): string {
  return process.env.BOOKING_NOTIFICATION_EMAIL ?? company.email;
}

async function sendWithResend(message: EmailMessage): Promise<EmailResult> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) return { ok: false, code: 'not_configured', provider: 'resend' };

  try {
    // Imported lazily so the SDK is not bundled when the provider is unused.
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [message.to],
      subject: sanitiseHeader(message.subject),
      html: message.html,
      text: message.text,
      replyTo: message.replyTo ?? getReplyToAddress(),
      ...(message.tag ? { tags: [{ name: 'category', value: message.tag }] } : {}),
    });

    if (error) {
      // The provider message is logged (masked) but never stored or shown.
      console.error('[email] provider rejected the message', {
        to: maskEmail(message.to),
        tag: message.tag ?? 'none',
        provider: 'resend',
        reason: error.name,
      });
      return { ok: false, code: 'provider_rejected', provider: 'resend' };
    }

    return { ok: true, id: data?.id ?? null, provider: 'resend' };
  } catch (error) {
    console.error('[email] provider unreachable', {
      to: maskEmail(message.to),
      tag: message.tag ?? 'none',
      provider: 'resend',
      reason: error instanceof Error ? error.name : 'unknown',
    });
    return { ok: false, code: 'provider_unreachable', provider: 'resend' };
  }
}

function sendWithConsole(message: EmailMessage): EmailResult {
  // Deliberately logs no message body: bodies contain personal data.
  console.info(
    `[email:console] to=${maskEmail(message.to)} from="${getFromAddress()}" replyTo="${
      message.replyTo ?? getReplyToAddress()
    }" subject="${sanitiseHeader(message.subject)}" tag=${
      message.tag ?? 'none'
    } — not sent (EMAIL_PROVIDER=console)`,
  );
  return { ok: true, id: null, provider: 'console', skipped: true };
}

/**
 * Sends an email. Never throws — callers get a result object so a delivery
 * failure can be recorded without rolling back a saved booking.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const env = getServerEnv();

  // Guard the recipient and headers before any provider sees them.
  if (!isSendableAddress(message.to)) {
    console.error('[email] refusing to send to an invalid recipient', {
      tag: message.tag ?? 'none',
    });
    return { ok: false, code: 'invalid_recipient', provider: env.EMAIL_PROVIDER };
  }
  if (!isHeaderSafe(message.subject) || (message.replyTo && !isSendableAddress(message.replyTo))) {
    console.error('[email] refusing to send: unsafe header content', {
      tag: message.tag ?? 'none',
    });
    return { ok: false, code: 'invalid_header', provider: env.EMAIL_PROVIDER };
  }

  switch (env.EMAIL_PROVIDER) {
    case 'resend':
      return sendWithResend(message);
    case 'console':
    default:
      return sendWithConsole(message);
  }
}
