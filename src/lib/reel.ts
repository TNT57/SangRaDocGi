/**
 * Reel geometry. The winner is already chosen (CLAUDE.md §6.1); this only works out
 * where the track must stop so the winner sits under the gold centre line.
 * Our own easing: fast start, long slow finish, ends at zero speed.
 */
export const CARD_WIDTH = 168;
export const CARD_GAP = 12;
export const STEP = CARD_WIDTH + CARD_GAP;
/** Cards before the winner. More cards = faster looking spin. */
export const LEAD_CARDS = 36;
export const TAIL_CARDS = 4;

export function ease(progress: number, power = 4): number {
  const p = Math.min(1, Math.max(0, progress));
  return 1 - Math.pow(1 - p, power);
}

/**
 * The track's left edge sits on the gold centre line (CSS `left: 50%`), so positions are
 * measured from that line and do not depend on screen width.
 * Returns the translateX (px) that puts a point inside card `index` under the line.
 * `offset` in [0,1) picks where inside the card it stops (kept away from the edges).
 */
export function positionFor(index: number, offset: number): number {
  const inside = CARD_WIDTH * (0.15 + 0.7 * Math.min(0.999, Math.max(0, offset)));
  return -(index * STEP + inside);
}

/** Where inside its card the line currently is, as an offset for positionFor. */
export function offsetAt(position: number, index: number): number {
  const inside = -position - index * STEP;
  return Math.min(0.999, Math.max(0, (inside / CARD_WIDTH - 0.15) / 0.7));
}

/** ~5 s, with a little variety so every spin feels a bit different. */
export function spinDuration(baseMs: number, random: () => number = Math.random): number {
  return Math.round(baseMs - 300 + random() * 600);
}
