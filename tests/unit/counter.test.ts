import { describe, expect, it } from 'vitest';
import { handleCounter, MemoryLimiter, MemoryStore, visitorId } from '../../src/server/counter';
import { formatCount, loadCount } from '../../src/lib/counter-client';

const req = (method: string, ip = '1.2.3.4') => new Request('https://x/api/counter', { method, headers: { 'x-forwarded-for': ip } });

describe('counter server (§6.3)', () => {
  it('starts at the real number, no fake start', async () => {
    const res = await handleCounter(req('GET'), { store: new MemoryStore(), limiters: [], salt: 's' });
    expect(await res.json()).toEqual({ count: 0 });
  });
  it('counts a POST and limits spam per visitor', async () => {
    const deps = { store: new MemoryStore(42), limiters: [new MemoryLimiter(2, 60_000)], salt: 's' };
    expect(await (await handleCounter(req('POST'), deps)).json()).toEqual({ count: 43, counted: true });
    await handleCounter(req('POST'), deps);
    const limited = await handleCounter(req('POST'), deps);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ count: 44, counted: false });
    // another visitor is not affected
    expect((await handleCounter(req('POST', '5.6.7.8'), deps)).status).toBe(200);
  });
  it('returns 503 when not configured or when the store fails', async () => {
    expect((await handleCounter(req('GET'), { store: null, limiters: [], salt: '' })).status).toBe(503);
    const broken = { get: () => Promise.reject(new Error('down')), increment: () => Promise.reject(new Error('down')) };
    expect((await handleCounter(req('GET'), { store: broken, limiters: [], salt: '' })).status).toBe(503);
  });
  it('never exposes the raw IP', async () => {
    const id = await visitorId(req('POST', '9.9.9.9'), 'salt');
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain('9.9.9.9');
  });
});

describe('counter client', () => {
  it('returns null (hide counter) on any failure', async () => {
    expect(await loadCount((async () => new Response('x', { status: 503 })) as typeof fetch)).toBeNull();
    expect(await loadCount((async () => { throw new Error('offline'); }) as typeof fetch)).toBeNull();
    expect(await loadCount((async () => Response.json({ count: -1 })) as typeof fetch)).toBeNull();
    expect(await loadCount((async () => Response.json({ count: 1873712 })) as typeof fetch)).toBe(1873712);
  });
  it('formats in Vietnamese style', () => {
    expect(formatCount(1873712)).toBe('1.873.712');
  });
});
