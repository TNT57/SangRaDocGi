import { TIERS, type Tier } from '../config/rarity';

/**
 * CLAUDE.md §6.5: fame = textbook count + log10(pageviews). Rank the whole pool, then cut
 * bottom 50% / 25% / 15% / 7% / top 3%. Rarity is never set by hand.
 */
export type FameInput = { textbookCount: number | null; pageviews12m: number | null };

export function fameScore(f: FameInput): number {
  return (f.textbookCount ?? 0) + Math.log10((f.pageviews12m ?? 0) + 1);
}

/** Returns slug → tier. Ties are broken by slug so the result is stable between builds. */
export function assignTiers(items: { slug: string; fame: FameInput }[]): Map<string, Tier> {
  const ranked = [...items].sort((a, b) => fameScore(a.fame) - fameScore(b.fame) || a.slug.localeCompare(b.slug));
  const cumulative: number[] = [];
  TIERS.reduce((sum, t) => (cumulative.push(sum + t.share), sum + t.share), 0);
  const n = ranked.length;
  const out = new Map<string, Tier>();
  ranked.forEach((item, i) => {
    const q = (i + 0.5) / n;
    const tier = cumulative.findIndex((c) => q < c + 1e-9);
    out.set(item.slug, (tier === -1 ? TIERS.length - 1 : tier) as Tier);
  });
  return out;
}
