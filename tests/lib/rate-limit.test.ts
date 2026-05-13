import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = 'test-allow-' + Date.now();
    const config = { maxRequests: 5, windowMs: 60000 };

    const result = rateLimit(key, config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests over the limit', () => {
    const key = 'test-block-' + Date.now();
    const config = { maxRequests: 3, windowMs: 60000 };

    // Use up all tokens
    rateLimit(key, config); // remaining 2
    rateLimit(key, config); // remaining 1
    rateLimit(key, config); // remaining 0

    // This should be blocked
    const result = rateLimit(key, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns correct remaining count', () => {
    const key = 'test-remaining-' + Date.now();
    const config = { maxRequests: 5, windowMs: 60000 };

    const r1 = rateLimit(key, config);
    expect(r1.remaining).toBe(4);

    const r2 = rateLimit(key, config);
    expect(r2.remaining).toBe(3);

    const r3 = rateLimit(key, config);
    expect(r3.remaining).toBe(2);
  });

  it('uses separate buckets for different keys', () => {
    const config = { maxRequests: 2, windowMs: 60000 };
    const keyA = 'test-separate-a-' + Date.now();
    const keyB = 'test-separate-b-' + Date.now();

    rateLimit(keyA, config);
    rateLimit(keyA, config);

    // keyA should be exhausted
    const resultA = rateLimit(keyA, config);
    expect(resultA.success).toBe(false);

    // keyB should still work
    const resultB = rateLimit(keyB, config);
    expect(resultB.success).toBe(true);
  });

  it('provides reset timestamp in the future', () => {
    const key = 'test-reset-' + Date.now();
    const config = { maxRequests: 5, windowMs: 60000 };

    const result = rateLimit(key, config);
    expect(result.reset).toBeGreaterThan(Date.now());
  });
});
