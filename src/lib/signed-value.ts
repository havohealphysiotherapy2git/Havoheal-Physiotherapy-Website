import 'server-only';
import crypto from 'node:crypto';

/**
 * HMAC-signed, time-limited values for cookies.
 *
 * Used so a booking reference can be handed back to the browser without ever
 * appearing in a URL, a referrer header, browser history or a server log.
 */

let ephemeralSecret: string | null = null;

function getSecret(): string {
  const configured =
    process.env.BOOKING_CONFIRMATION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;

  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(48).toString('hex');
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[security] BOOKING_CONFIRMATION_SECRET is not set. Falling back to a per-process key: confirmation links will stop working after a restart or on another instance. Set it before launch.',
      );
    }
  }
  return ephemeralSecret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/** Signs `value` with an expiry. Format: payload.expiry.signature */
export function signValue(value: string, ttlSeconds: number): string {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${base64url(value)}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', getSecret()).update(payload).digest();
  return `${payload}.${base64url(signature)}`;
}

/** Verifies and returns the value, or null if tampered with or expired. */
export function verifyValue(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encoded, expiryRaw, signatureRaw] = parts as [string, string, string];
  const payload = `${encoded}.${expiryRaw}`;

  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest();
  const provided = fromBase64url(signatureRaw);

  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  const expiresAt = Number(expiryRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return fromBase64url(encoded).toString('utf8');
}

/** Constant-time string comparison for secrets of arbitrary length. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Coarse request fingerprint for abuse investigation.
 * Hashed so no raw IP address is stored — a hash is enough to spot repeat
 * abuse without retaining an identifier in the clear.
 */
export function fingerprintRequest(ip: string | null, userAgent: string | null): string {
  const material = `${ip ?? 'unknown'}|${(userAgent ?? '').slice(0, 120)}`;
  return crypto
    .createHmac('sha256', getSecret())
    .update(material)
    .digest('hex')
    .slice(0, 32);
}

/** Rate-limit bucket key derived from the client IP, never stored. */
export function rateLimitKey(prefix: string, ip: string | null): string {
  return `${prefix}:${crypto.createHash('sha256').update(ip ?? 'unknown').digest('hex').slice(0, 24)}`;
}
