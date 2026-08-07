import { z } from 'zod';

/**
 * Environment variable validation.
 *
 * Server variables are validated lazily on first access so that `next build`
 * does not require a live database or an email provider. Anything genuinely
 * required at runtime throws a clear, actionable error the first time it is
 * used rather than failing deep inside a request.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required. See .env.example.')
    .refine(
      (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
      'DATABASE_URL must be a PostgreSQL connection string.',
    ),

  /** Email provider. "resend" sends real email; "console" logs instead. */
  EMAIL_PROVIDER: z.enum(['resend', 'console']).default('console'),
  RESEND_API_KEY: z.string().optional(),

  /**
   * Sender address. Accepts a bare address or "Display Name <address>".
   * Must be on a domain verified with the transactional email provider.
   */
  BOOKING_FROM_EMAIL: z.string().min(3).optional(),
  /** Legacy name for BOOKING_FROM_EMAIL; still honoured if set. */
  EMAIL_FROM: z.string().min(3).optional(),

  /** Where replies from customers should land. */
  BOOKING_REPLY_TO_EMAIL: z.string().email().optional(),
  /** Where new booking requests and enquiries are sent internally. */
  BOOKING_NOTIFICATION_EMAIL: z.string().email().optional(),

  /** Admin access. Admin routes stay disabled until both are set. */
  ADMIN_EMAIL: z.string().email().optional(),
  /** scrypt hash produced by `npm run admin:hash` — never a plaintext password. */
  ADMIN_PASSWORD_HASH: z.string().optional(),
  /** 32+ character random string used to sign the admin session cookie. */
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),

  /** Optional bot protection (Cloudflare Turnstile). */
  TURNSTILE_SECRET_KEY: z.string().optional(),

  /** Optional address lookup provider (e.g. getAddress.io, Ideal Postcodes). */
  ADDRESS_LOOKUP_PROVIDER: z.enum(['none', 'getaddress', 'ideal-postcodes']).default('none'),
  ADDRESS_LOOKUP_API_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  /** Privacy-conscious analytics. Empty = analytics disabled entirely. */
  NEXT_PUBLIC_ANALYTICS_PROVIDER: z.enum(['none', 'plausible', 'umami']).optional(),
  NEXT_PUBLIC_ANALYTICS_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_SCRIPT_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let cachedServerEnv: ServerEnv | null = null;

/**
 * Validates and returns server environment variables.
 * Throws a readable aggregate error listing every problem at once.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in the required values.`,
    );
  }

  // Cross-field rules that a flat schema cannot express.
  const env = parsed.data;
  if (env.EMAIL_PROVIDER === 'resend') {
    if (!env.RESEND_API_KEY) {
      throw new Error('EMAIL_PROVIDER is "resend" but RESEND_API_KEY is not set.');
    }
    if (!env.BOOKING_FROM_EMAIL && !env.EMAIL_FROM) {
      throw new Error(
        'EMAIL_PROVIDER is "resend" but BOOKING_FROM_EMAIL is not set. It must be an address on a domain verified with Resend — see docs/email-setup.md.',
      );
    }
    if (!env.BOOKING_NOTIFICATION_EMAIL) {
      throw new Error(
        'EMAIL_PROVIDER is "resend" but BOOKING_NOTIFICATION_EMAIL is not set. Booking requests would have nowhere to go.',
      );
    }
  }
  if (env.ADDRESS_LOOKUP_PROVIDER !== 'none' && !env.ADDRESS_LOOKUP_API_KEY) {
    throw new Error(
      'ADDRESS_LOOKUP_PROVIDER is set but ADDRESS_LOOKUP_API_KEY is missing. Set the key or use "none".',
    );
  }

  cachedServerEnv = env;
  return env;
}

/**
 * Client env. Next.js inlines NEXT_PUBLIC_* at build time, so these must be
 * referenced as literal property accesses.
 */
export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_ANALYTICS_PROVIDER: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
  NEXT_PUBLIC_ANALYTICS_DOMAIN: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN,
  NEXT_PUBLIC_ANALYTICS_SCRIPT_URL: process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL,
});

/** True when admin authentication is fully configured. */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.ADMIN_SESSION_SECRET &&
      process.env.ADMIN_SESSION_SECRET.length >= 32,
  );
}

/** True when bot protection is configured on both ends. */
export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}
