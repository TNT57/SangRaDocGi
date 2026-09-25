import { describe, expect, it } from 'vitest';
import { fillerCards, pick, suggestTheme, weightedByTier, type Pickable } from '../../src/lib/picker';
import { daysBetween, localDay, recordOpen, remaining, today } from '../../src/lib/daily';
import { ease, STEP, CARD_WIDTH, offsetAt, positionFor } from '../../src/lib/reel';
import type { Tier } from '../../src/config/rarity';

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};
const r = (slug: string, theme: Pickable['theme'], tier: Tier): Pickable => ({ slug, theme, tier });
const pool = [
  r('a', 'thien-nhien', 0),
  r('b', 'thien-nhien', 4),
  r('c', 'tieng-cuoi', 0),
  r('d', 'tieng-cuoi', 1),
  r('e', 'tinh-cam', 2),
];

describe('picker (§6.1)', () => {
  it('only picks unopened readings in the tab', () => {
    const res = pick(pool, 'thien-nhien', new Set(['a']), seq(0.1, 0.1));
    expect(res).toEqual({ kind: 'reading', reading: pool[1], repeat: false });
  });
  it('follows drop chances across tiers', () => {
    const counts = new Map<string, number>();
    let x = 0.123;
    const rnd = () => (x = (x * 9301 + 0.49297) % 1);
    for (let i = 0; i < 20000; i++) {
      const got = weightedByTier([pool[0]!, pool[1]!], rnd);
      counts.set(got.slug, (counts.get(got.slug) ?? 0) + 1);
    }
    // blue 55 vs gold 2 → gold ≈ 2/57 ≈ 3.5 %
    const goldShare = (counts.get('b') ?? 0) / 20000;
    expect(goldShare).toBeGreaterThan(0.02);
    expect(goldShare).toBeLessThan(0.05);
  });
  it('says the theme is exhausted and suggests the fullest other theme', () => {
    const res = pick(pool, 'thien-nhien', new Set(['a', 'b', 'e']), seq(0.5));
    expect(res).toEqual({ kind: 'theme-exhausted', suggestion: 'tieng-cuoi' });
  });
  it('repeats when the whole pool is opened — the button is never dead', () => {
    const all = new Set(pool.map((p) => p.slug));
    const res = pick(pool, 'tinh-cam', all, seq(0.5));
    expect(res).toEqual({ kind: 'reading', reading: pool[4], repeat: true });
    expect(pick(pool, 'tat-ca', all, seq(0.5))).toMatchObject({ kind: 'reading', repeat: true });
  });
  it('handles an empty pool', () => {
    expect(pick([], 'tat-ca', new Set())).toEqual({ kind: 'empty' });
    expect(suggestTheme([], new Set())).toBeNull();
    expect(fillerCards([], 5)).toEqual([]);
  });
});

describe('daily limit (§3)', () => {
  const morning = new Date(2026, 8, 25, 7, 0);
  const lateNight = new Date(2026, 8, 25, 23, 59);
  const nextDay = new Date(2026, 8, 26, 0, 1);
  it('counts down from 10', () => {
    let s = null;
    for (let i = 0; i < 3; i++) s = recordOpen(s, `x${i}`, morning);
    expect(remaining(s, 10, morning)).toBe(7);
  });
  it('never goes below zero', () => {
    let s = null;
    for (let i = 0; i < 12; i++) s = recordOpen(s, `x${i}`, morning);
    expect(remaining(s, 10, lateNight)).toBe(0);
  });
  it('resets at local midnight', () => {
    const s = recordOpen(null, 'x', lateNight);
    expect(remaining(s, 10, nextDay)).toBe(10);
    expect(today(s, nextDay).opens).toEqual([]);
  });
  it('formats local days and counts days between them', () => {
    expect(localDay(morning)).toBe('2026-09-25');
    expect(daysBetween('2026-09-25', '2026-10-02')).toBe(7);
  });
});

describe('reel geometry', () => {
  it('eases from 0 to 1 and ends slow', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.95) - ease(0.9)).toBeLessThan(ease(0.1) - ease(0.05));
  });
  it('lands the winner card under the centre line', () => {
    for (const offset of [0, 0.5, 0.99]) {
      const lineInTrack = -positionFor(36, offset);
      expect(lineInTrack).toBeGreaterThan(36 * STEP);
      expect(lineInTrack).toBeLessThan(36 * STEP + CARD_WIDTH);
      expect(offsetAt(positionFor(36, offset), 36)).toBeCloseTo(Math.min(0.999, offset));
    }
  });
});
