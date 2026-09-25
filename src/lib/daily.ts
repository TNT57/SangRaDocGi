/**
 * CLAUDE.md §3: 10 crates per device per day. Resets at midnight, device local time.
 */
export type DailyState = { day: string; opens: string[] };

/** Local calendar day as YYYY-MM-DD. */
export function localDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's state; yesterday's state becomes an empty one. */
export function today(state: DailyState | null, now: Date = new Date()): DailyState {
  const day = localDay(now);
  return state && state.day === day ? state : { day, opens: [] };
}

export function remaining(state: DailyState | null, limit: number, now: Date = new Date()): number {
  return Math.max(0, limit - today(state, now).opens.length);
}

export function recordOpen(state: DailyState | null, slug: string, now: Date = new Date()): DailyState {
  const current = today(state, now);
  return { day: current.day, opens: [...current.opens, slug] };
}

/** Whole days between two YYYY-MM-DD strings (b − a). */
export function daysBetween(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y!, m! - 1, d!);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}
