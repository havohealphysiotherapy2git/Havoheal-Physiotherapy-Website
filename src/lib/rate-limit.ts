import 'server-only';

/**
 * In-memory fixed-window rate limiter.
 *
 * Deliberately simple and dependency-free. It protects a single server instance
 * against burst abuse and accidental double submits.
 *
 * PRODUCTION NOTE: serverless platforms run many isolated instances, so this
 * limiter is per-instance and not a global guarantee. For a hard global limit,
 * put a WAF/rate limit in front (Cloudflare, Vercel Firewall) or swap the
 * `RateLimitStore` implementation for Redis/Upstash. See docs/security-checklist.md.
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

/** Removes expired buckets so the map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, retryAfterSeconds: windowSeconds };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    success: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Tuned limits for each public entry point. */
export const rateLimits = {
  booking: { limit: 5, windowSeconds: 15 * 60 },
  contact: { limit: 5, windowSeconds: 15 * 60 },
  availability: { limit: 60, windowSeconds: 60 },
  adminLogin: { limit: 5, windowSeconds: 15 * 60 },
} as const;
