import { getClientIp } from '@/lib/signatureEvidence';

/**
 * Fixed-window, in-process rate limiting.
 *
 * Deliberately dependency-free. On Vercel each serverless instance keeps its own
 * counter and cold starts reset it, so this is **best-effort**: it stops the
 * cheap, high-volume abuse that actually costs money (a script hammering the
 * contact form through our Resend account, or brute-forcing a signing token)
 * without adding a Redis account to the launch critical path. Put a Vercel
 * Firewall rule in front of the spend endpoints for the hard guarantee.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bound the map so a flood of distinct keys cannot grow it without limit.
const MAX_KEYS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still full of live entries: drop the oldest arbitrarily rather than grow.
  if (buckets.size >= MAX_KEYS) {
    const excess = buckets.size - MAX_KEYS + 1;
    let dropped = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++dropped >= excess) break;
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets. Suitable for a Retry-After header. */
  retryAfter: number;
}

/**
 * Consume one unit from `key`'s window.
 *
 * @param limit  requests allowed per window
 * @param windowMs  window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }
  return { ok: true, remaining: limit - existing.count, retryAfter };
}

/**
 * Rate limit a request by caller IP, namespaced so separate endpoints don't
 * share a budget. Reuses the same IP resolution as the signature-evidence code
 * so there is one definition of "who is calling" in the codebase.
 */
export function rateLimitRequest(
  request: Request,
  namespace: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const ip = getClientIp(request) || 'unknown';
  return rateLimit(`${namespace}:${ip}`, limit, windowMs);
}

/** A ready-to-return 429 carrying Retry-After. */
export function tooManyRequests(result: RateLimitResult, message?: string): Response {
  return new Response(
    JSON.stringify({
      error: message || 'Too many requests. Please wait a moment and try again.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter),
      },
    },
  );
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
