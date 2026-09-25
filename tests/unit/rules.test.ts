import { describe, expect, it } from 'vitest';
import { flagsForDeath, flagsForPeople, looserThanComputed, safeEverywhere } from '../../src/lib/copyright';
import { assignTiers, fameScore } from '../../src/lib/rarity';

describe('copyright (§8.3 table, as seen in 2025)', () => {
  const Y = 2025;
  it('died 1947 or earlier → free everywhere', () => {
    expect(flagsForDeath(1942, Y)).toEqual({ vn: 'free', au: 'free', us: 'free' });
    expect(flagsForDeath(1947, Y)).toEqual({ vn: 'free', au: 'free', us: 'free' });
  });
  it('1948–1954 → VN + AU only (Nam Cao 1951, Ngô Tất Tố 1954)', () => {
    expect(flagsForDeath(1951, Y)).toEqual({ vn: 'free', au: 'free', us: 'protected' });
    expect(flagsForDeath(1954, Y)).toEqual({ vn: 'free', au: 'free', us: 'protected' });
  });
  it('1955–1974 → VN only (Nguyễn Huy Tưởng 1960, Hồ Chí Minh 1969)', () => {
    expect(flagsForDeath(1960, Y)).toEqual({ vn: 'free', au: 'protected', us: 'protected' });
    expect(flagsForDeath(1969, Y)).toEqual({ vn: 'free', au: 'protected', us: 'protected' });
  });
  it('terms roll forward each year (VN life+50, AU life+70)', () => {
    expect(flagsForDeath(1975, 2025).vn).toBe('protected');
    expect(flagsForDeath(1975, 2026).vn).toBe('free');
    expect(flagsForDeath(1955, 2026).au).toBe('free');
    expect(flagsForDeath(1955, 2026).us).toBe('protected');
  });
  it('unknown/living is protected; folk is free', () => {
    expect(safeEverywhere(flagsForDeath(null, Y))).toBe(false);
    expect(safeEverywhere(flagsForPeople([{ name: 'Dân gian', died: null, folk: true }], Y))).toBe(true);
  });
  it('the translator decides too (Trần Trọng Kim d. 1953)', () => {
    const flags = flagsForPeople([{ name: 'Lý Thường Kiệt', died: 1105 }, { name: 'Trần Trọng Kim', died: 1953 }], Y);
    expect(safeEverywhere(flags)).toBe(false);
    expect(flags.us).toBe('protected');
  });
  it('stored flags may be stricter, never looser', () => {
    const computed = flagsForDeath(1939, Y);
    expect(looserThanComputed({ vn: 'free', au: 'free', us: 'protected' }, computed)).toEqual([]);
    expect(looserThanComputed({ vn: 'free', au: 'free', us: 'free' }, flagsForDeath(1951, Y))).toEqual(['us']);
  });
});

describe('rarity (§6.5)', () => {
  it('fame = textbook count + log10(pageviews)', () => {
    expect(fameScore({ textbookCount: 3, pageviews12m: 999 })).toBeCloseTo(6);
    expect(fameScore({ textbookCount: null, pageviews12m: null })).toBe(0);
  });
  it('cuts the ranked pool 50/25/15/7/3', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ slug: `r${String(i).padStart(3, '0')}`, fame: { textbookCount: 0, pageviews12m: i * 10 } }));
    const tiers = assignTiers(items);
    const counts = [0, 0, 0, 0, 0];
    for (const t of tiers.values()) counts[t]!++;
    expect(counts).toEqual([50, 25, 15, 7, 3]);
    expect(tiers.get('r099')).toBe(4);
    expect(tiers.get('r000')).toBe(0);
  });
  it('is stable for ties', () => {
    const items = [{ slug: 'b', fame: { textbookCount: 1, pageviews12m: 0 } }, { slug: 'a', fame: { textbookCount: 1, pageviews12m: 0 } }];
    expect([...assignTiers(items).entries()]).toEqual([...assignTiers([...items].reverse()).entries()]);
  });
});
