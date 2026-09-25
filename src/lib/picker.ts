import { TIERS, type Tier } from '../config/rarity';
import { ALL, THEMES, type TabId, type ThemeId } from '../config/themes';

/**
 * CLAUDE.md §6.1. The result is chosen here, before any animation.
 * 1. Candidates = readings in the tab. Prefer ones this device has not opened.
 * 2. Pick a tier by drop chance, renormalised over tiers that have candidates.
 * 3. Pick uniformly inside that tier.
 */
export type Pickable = { slug: string; theme: ThemeId; tier: Tier };
export type Random = () => number;

export type PickResult<T extends Pickable> =
  | { kind: 'reading'; reading: T; repeat: boolean }
  | { kind: 'theme-exhausted'; suggestion: ThemeId | null }
  | { kind: 'empty' };

export function weightedByTier<T extends Pickable>(items: T[], random: Random): T {
  if (items.length === 0) throw new Error('weightedByTier: no items');
  const present = [...new Set(items.map((i) => i.tier))].sort();
  const total = present.reduce<number>((s, t) => s + TIERS[t].drop, 0);
  let draw = random() * total;
  let tier = present[present.length - 1]!;
  for (const t of present) {
    draw -= TIERS[t].drop;
    if (draw < 0) {
      tier = t;
      break;
    }
  }
  const inTier = items.filter((i) => i.tier === tier);
  return inTier[Math.min(inTier.length - 1, Math.floor(random() * inTier.length))]!;
}

export function pick<T extends Pickable>(pool: T[], tab: TabId, opened: ReadonlySet<string>, random: Random = Math.random): PickResult<T> {
  if (pool.length === 0) return { kind: 'empty' };
  const candidates = tab === ALL ? pool : pool.filter((r) => r.theme === tab);
  const fresh = candidates.filter((r) => !opened.has(r.slug));
  if (fresh.length > 0) return { kind: 'reading', reading: weightedByTier(fresh, random), repeat: false };

  const anyFreshInPool = pool.some((r) => !opened.has(r.slug));
  if (tab !== ALL && anyFreshInPool) return { kind: 'theme-exhausted', suggestion: suggestTheme(pool, opened) };

  // Whole pool opened: the crate still works, but repeats (CLAUDE.md §6.1).
  const from = candidates.length > 0 ? candidates : pool;
  return { kind: 'reading', reading: weightedByTier(from, random), repeat: true };
}

/** The theme with the most unopened readings, or null if none are left. */
export function suggestTheme(pool: Pickable[], opened: ReadonlySet<string>): ThemeId | null {
  let best: ThemeId | null = null;
  let bestCount = 0;
  for (const { id } of THEMES) {
    const count = pool.filter((r) => r.theme === id && !opened.has(r.slug)).length;
    if (count > bestCount) (best = id), (bestCount = count);
  }
  return best;
}

/** Cards that pass by in the reel. Pure decoration: never affects the result. */
export function fillerCards<T extends Pickable>(pool: T[], count: number, random: Random = Math.random): T[] {
  if (pool.length === 0) return [];
  return Array.from({ length: count }, () => weightedByTier(pool, random));
}
