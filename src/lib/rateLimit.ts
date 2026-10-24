// Fixed-window rate limiter on Upstash Redis, keyed per user. Unlike the
// minute-bucketed helper in app/lib/redis.ts, the window here really is
// `windowSeconds` long, so hour-long limits work. Fails open if Redis is
// unreachable so an outage never locks users out of the app.
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function rateLimit(name: string, id: string, limit: number, windowSeconds: number) {
  const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${name}:${id}:${windowId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    const retryAfter = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
    return { allowed: count <= limit, retryAfter };
  } catch (err) {
    console.error('[rateLimit] check failed, failing open:', err);
    return { allowed: true, retryAfter: 0 };
  }
}

export function tooManyRequests(retryAfter: number, message = 'Too many requests. Please slow down and try again shortly.') {
  return NextResponse.json({ error: message }, { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfter)) } });
}
