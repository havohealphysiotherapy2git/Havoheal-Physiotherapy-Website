'use server';

import { contactSchema, toUkE164 } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-context';
import { rateLimitKey } from '@/lib/signed-value';
import { generateContactReference } from '@/lib/utils';
import { company } from '@/config/site';
import { getBusinessNotificationAddress, sendEmail } from '@/lib/email/provider';
import {
  buildContactAcknowledgement,
  buildContactNotification,
} from '@/lib/email/templates';

export type ContactActionResult =
  | { status: 'success'; reference: string }
  | { status: 'validation-error'; fieldErrors: Record<string, string>; message: string }
  | { status: 'rate-limited'; message: string }
  | { status: 'server-error'; message: string };

export async function submitContactMessage(payload: unknown): Promise<ContactActionResult> {
  const ip = await getClientIp();

  const limit = rateLimit(
    rateLimitKey('contact', ip),
    rateLimits.contact.limit,
    rateLimits.contact.windowSeconds,
  );
  if (!limit.success) {
    return {
      status: 'rate-limited',
      message: `You have sent several messages in a short time. Please wait a few minutes, or call us on ${company.phoneDisplay}.`,
    };
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: 'validation-error',
      fieldErrors,
      message: 'Some details need checking before we can send your message.',
    };
  }

  const data = parsed.data;

  // Honeypot — silently accepted from the bot's point of view, never stored.
  if (data.website && data.website.length > 0) {
    return { status: 'success', reference: generateContactReference() };
  }

  try {
    const reference = generateContactReference();

    // The phone number is optional here; when given, store it in E.164.
    const phone = data.phoneNumber ? toUkE164(data.phoneNumber) : null;

    await prisma.contactMessage.create({
      data: {
        reference,
        fullName: data.fullName,
        email: data.email,
        phone,
        subject: data.subject,
        message: data.message,
        consentContact: data.consentContact,
      },
    });

    await Promise.all([
      sendEmail(
        buildContactNotification(
          {
            reference,
            fullName: data.fullName,
            email: data.email,
            phone,
            subject: data.subject,
            message: data.message,
          },
          getBusinessNotificationAddress(),
        ),
      ),
      sendEmail(
        buildContactAcknowledgement({
          reference,
          fullName: data.fullName,
          email: data.email,
          subject: data.subject,
        }),
      ),
    ]);

    return { status: 'success', reference };
  } catch (error) {
    console.error('[contact] submission failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return {
      status: 'server-error',
      message: `We could not send your message just now. Please try again, call us on ${company.phoneDisplay}, or email ${company.email} directly.`,
    };
  }
}
