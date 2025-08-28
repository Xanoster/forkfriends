
// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import client from 'prom-client';

// Use the default, global registry
const register = client.register;

// Clear the registry of any old metrics to prevent duplicates
register.clear();

// Enable the collection of default metrics, but without the 'nodejs_' prefix
// to avoid potential conflicts and focus on what's essential.
client.collectDefaultMetrics({
  prefix: 'forkfriends_',
});

// Create a custom counter metric to verify the endpoint is being scraped
const requestCounter = new client.Counter({
  name: 'forkfriends_requests_total',
  help: 'Total number of requests to the metrics endpoint',
});

// This is the crucial part to prevent caching and ensure fresh data on every request.
export const dynamic = 'force-dynamic';

export async function GET() {
  // Increment the custom counter on every scrape
  requestCounter.inc();

  try {
    const metrics = await register.metrics();
    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return new Response("Failed to get metrics", { status: 500 });
  }
}
