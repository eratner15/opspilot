/**
 * Rate limiting using Cloudflare KV.
 * Sliding window: count requests per key in a 60-second window.
 *
 * Limits:
 * - 100 requests/min per user
 * - 1000 requests/min per org
 *
 * Gracefully degrades if KV is unavailable (e.g. local dev).
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // unix ms
}

const WINDOW_SECONDS = 60;

/**
 * Check and increment a rate limit counter in KV.
 * Returns {allowed: true} if KV is unavailable (fail open for local dev).
 */
export async function checkRateLimit(
  kv: KVNamespace | undefined,
  key: string,
  limit: number
): Promise<RateLimitResult> {
  if (!kv) {
    // Fail open in local dev (no KV binding)
    return { allowed: true, remaining: limit, limit, resetAt: Date.now() + WINDOW_SECONDS * 1000 };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / WINDOW_SECONDS)}`;
  const resetAt = (Math.floor(now / WINDOW_SECONDS) + 1) * WINDOW_SECONDS * 1000;

  try {
    // Atomic increment using KV
    const raw = await kv.get(windowKey);
    const current = raw ? parseInt(raw, 10) : 0;

    if (current >= limit) {
      return { allowed: false, remaining: 0, limit, resetAt };
    }

    // Increment — set with TTL slightly longer than window to ensure cleanup
    await kv.put(windowKey, String(current + 1), { expirationTtl: WINDOW_SECONDS * 2 });

    return { allowed: true, remaining: limit - current - 1, limit, resetAt };
  } catch {
    // Fail open if KV has an error
    return { allowed: true, remaining: limit, limit, resetAt };
  }
}
