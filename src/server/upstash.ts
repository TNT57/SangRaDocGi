import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import type { CounterStore, Limiter } from './counter';

const KEY = 'ketsach:opens';

/** Reads Upstash credentials (Vercel integration names first). Returns null when not configured. */
export function upstashFromEnv(env: Record<string, string | undefined>): { store: CounterStore; limiters: Limiter[] } | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  const store: CounterStore = {
    get: async () => Number((await redis.get<number>(KEY)) ?? 0),
    increment: () => redis.incr(KEY),
  };
  // Same as the daily crate limit, plus a short burst guard.
  const perDay = new Ratelimit({ redis, prefix: 'ketsach:rl:day', limiter: Ratelimit.slidingWindow(10, '1 d') });
  const burst = new Ratelimit({ redis, prefix: 'ketsach:rl:burst', limiter: Ratelimit.fixedWindow(1, '3 s') });
  const limiters: Limiter[] = [
    { allow: async (id) => (await burst.limit(id)).success },
    { allow: async (id) => (await perDay.limit(id)).success },
  ];
  return { store, limiters };
}
