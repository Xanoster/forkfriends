import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Inline rate limiter (Edge-compatible, no external imports)
interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

function rateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { tokens: maxRequests - 1, lastRefill: now });
    return { success: true, remaining: maxRequests - 1 };
  }

  const elapsed = now - entry.lastRefill;
  const refillRate = maxRequests / windowMs;
  entry.tokens = Math.min(maxRequests, entry.tokens + elapsed * refillRate);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    return { success: false, remaining: 0 };
  }

  entry.tokens -= 1;
  return { success: true, remaining: Math.floor(entry.tokens) };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export default clerkMiddleware(async (_auth, request) => {
  // Only rate-limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method);
    const maxReq = isWrite ? 20 : 60;
    const result = rateLimit(`${ip}:${isWrite ? 'w' : 'r'}`, maxReq, 60_000);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
