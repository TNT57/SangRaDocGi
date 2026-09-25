/**
 * CLAUDE.md §6.3. Load once on page open; after your own spin show +1 locally.
 * No polling, no websockets. Any failure → null → the counter is hidden.
 */
export async function loadCount(fetcher: typeof fetch = fetch): Promise<number | null> {
  try {
    const res = await fetcher('/api/counter', { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const body = (await res.json()) as { count?: unknown };
    return Number.isSafeInteger(body.count) && (body.count as number) >= 0 ? (body.count as number) : null;
  } catch {
    return null;
  }
}

/** Fire and forget. The page never waits for it. */
export function reportOpen(fetcher: typeof fetch = fetch): void {
  try {
    void fetcher('/api/counter', { method: 'POST', keepalive: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n);
}
