/**
 * CLAUDE.md §6.5. Colours only, never names. Index 0 = most common (blue), 4 = rarest (gold).
 * `share` is the part of the pool in the tier; `drop` is the chance a crate lands on the tier.
 */
export const TIERS = [
  { color: '#4b69ff', share: 0.5, drop: 0.55 },
  { color: '#8847ff', share: 0.25, drop: 0.25 },
  { color: '#d32ce6', share: 0.15, drop: 0.13 },
  { color: '#eb4b4b', share: 0.07, drop: 0.05 },
  { color: '#ffd700', share: 0.03, drop: 0.02 },
] as const;

export type Tier = 0 | 1 | 2 | 3 | 4;
export const TIER_COUNT = TIERS.length;

export function tierColor(tier: Tier): string {
  return TIERS[tier].color;
}
