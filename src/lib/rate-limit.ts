/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance / serverless at scale, replace with @upstash/ratelimit.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

const cleanup = () => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const staleThreshold = now - 60_000;
  for (const [key, entry] of store) {
    if (entry.lastRefill < staleThreshold) {
      store.delete(key);
    }
  }
};

export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be allowed under the rate limit.
 * Uses a token bucket algorithm with refill.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { tokens: config.maxRequests - 1, lastRefill: now });
    return { success: true, remaining: config.maxRequests - 1, reset: now + config.windowMs };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refillRate = config.maxRequests / config.windowMs;
  const tokensToAdd = elapsed * refillRate;
  entry.tokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    const timeToNextToken = (1 - entry.tokens) / refillRate;
    return { success: false, remaining: 0, reset: now + timeToNextToken };
  }

  entry.tokens -= 1;
  return { success: true, remaining: Math.floor(entry.tokens), reset: now + config.windowMs };
}
