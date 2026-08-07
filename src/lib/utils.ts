import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges conditional class names and resolves Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a booking reference such as "HH-7K2P4M".
 * Uses an unambiguous alphabet (no O/0, I/1, S/5) so references can be read
 * aloud over the phone without confusion.
 */
const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRTUVWXY';

export function generateBookingReference(random: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < 6; i += 1) {
    body += REFERENCE_ALPHABET.charAt(Math.floor(random() * REFERENCE_ALPHABET.length));
  }
  return `HH-${body}`;
}

/** Generates a contact-message reference such as "HC-7K2P4M". */
export function generateContactReference(random: () => number = Math.random): string {
  return generateBookingReference(random).replace('HH-', 'HC-');
}

/** Web Crypto based random id, used for client-side idempotency keys. */
export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Truncates text for logs and email previews without breaking mid-word. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Escapes a string for safe interpolation into an HTML email template. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Turns a plain-text block into escaped HTML paragraphs for emails. */
export function textToHtmlParagraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('');
}
