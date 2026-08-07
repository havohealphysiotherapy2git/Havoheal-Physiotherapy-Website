import 'server-only';
import { headers } from 'next/headers';

/**
 * Request metadata helpers.
 *
 * The client IP is read from platform-set forwarding headers. These can be
 * spoofed when the app is not behind a trusted proxy, so the IP is used only
 * for rate limiting and hashed fingerprints — never for authorisation.
 */
export async function getClientIp(): Promise<string | null> {
  const headerList = await headers();

  const candidates = [
    headerList.get('x-vercel-forwarded-for'),
    headerList.get('cf-connecting-ip'),
    headerList.get('x-real-ip'),
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.length > 0) return candidate;
  }
  return null;
}

export async function getUserAgent(): Promise<string | null> {
  return (await headers()).get('user-agent');
}

/**
 * Verifies a Cloudflare Turnstile token.
 * Returns true when bot protection is not configured, so the site works out of
 * the box and hardens automatically once credentials are supplied.
 */
export async function verifyCaptcha(
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body, cache: 'no-store' },
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error('[security] Turnstile verification failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    // Fail closed: if bot protection is switched on it must actually protect.
    return false;
  }
}
