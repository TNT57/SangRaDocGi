/**
 * CLAUDE.md §5.8 and §10. GoatCounter: no cookies, so no banner. Does nothing when
 * PUBLIC_GOATCOUNTER_CODE is not set. Events carry no personal data.
 *   open              — a crate was opened              → crates per day
 *   read-end/<slug>   — reader reached the end of text  → % of opens read to the end
 *   first-visit       — first day on this device
 *   return-d<N>       — came back N days after first visit (once per day) → 7-day return
 */
type GoatCounter = { count?: (vars: { path: string; title?: string; event?: boolean }) => void };
declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

const queue: string[] = [];

function flush(): void {
  const gc = window.goatcounter;
  if (!gc?.count) return;
  while (queue.length) gc.count({ path: queue.shift()!, event: true });
}

export function track(event: string): void {
  if (typeof window === 'undefined') return;
  queue.push(event);
  flush();
  if (queue.length) window.setTimeout(flush, 3000);
}
