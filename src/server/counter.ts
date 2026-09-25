/**
 * The only server code in the MVP (CLAUDE.md §6.3). Counts crates opened by everyone.
 * GET  → { count }
 * POST → +1 unless this visitor is over the limit → { count, counted }
 * Visitors are identified only by a salted SHA-256 of their IP, which is never stored raw.
 */
export interface CounterStore {
  get(): Promise<number>;
  increment(): Promise<number>;
}

export interface Limiter {
  /** true = allowed */
  allow(visitor: string): Promise<boolean>;
}

export class MemoryStore implements CounterStore {
  constructor(private value = 0) {}
  async get() {
    return this.value;
  }
  async increment() {
    return ++this.value;
  }
}

/** In-memory limiter used by tests: `max` hits per `windowMs`, per visitor. */
export class MemoryLimiter implements Limiter {
  private hits = new Map<string, number[]>();
  constructor(
    private max: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}
  async allow(visitor: string) {
    const t = this.now();
    const recent = (this.hits.get(visitor) ?? []).filter((h) => t - h < this.windowMs);
    if (recent.length >= this.max) return this.hits.set(visitor, recent), false;
    recent.push(t);
    this.hits.set(visitor, recent);
    return true;
  }
}

export async function visitorId(request: Request, salt: string): Promise<string> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function handleCounter(
  request: Request,
  deps: { store: CounterStore | null; limiters: Limiter[]; salt: string },
): Promise<Response> {
  if (!deps.store) return json({ error: 'counter not configured' }, 503);
  try {
    if (request.method === 'GET') return json({ count: await deps.store.get() });
    if (request.method === 'POST') {
      const id = await visitorId(request, deps.salt);
      for (const limiter of deps.limiters) {
        if (!(await limiter.allow(id))) return json({ count: await deps.store.get(), counted: false }, 429);
      }
      return json({ count: await deps.store.increment(), counted: true });
    }
    return json({ error: 'method not allowed' }, 405);
  } catch {
    return json({ error: 'counter unavailable' }, 503);
  }
}
