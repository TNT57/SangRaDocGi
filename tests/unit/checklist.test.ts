import { describe, expect, it } from 'vitest';
import { checkReading, type ReadingRecord } from '../../src/lib/checklist';
import { buildViews } from '../../src/lib/readings';
import { readingSchema } from '../../src/lib/schema';
import { isDailyState, isSlugList } from '../../src/lib/storage';

const measured = { measured: true, proseSyllablesPerMinute: 200, verseSyllablesPerMinute: 100, measuredBy: 'Nathan', measuredOn: '2026-10-01' };

function record(overrides: Record<string, unknown> = {}, body = 'Ao thu lạnh lẽo nước trong veo,'): ReadingRecord {
  const data = readingSchema.parse({
    title: 'Thu điếu',
    status: 'published',
    theme: 'thien-nhien',
    genre: 'tho',
    form: 'verse',
    authors: [{ name: 'Nguyễn Khuyến', born: 1835, died: 1909 }],
    source: { name: 'Wikisource', url: 'https://vi.wikisource.org/wiki/Thu_điếu' },
    copyright: { vn: 'free', au: 'free', us: 'free' },
    heavy: false,
    proofread: { against: 'Quốc văn trích diễm scan', by: 'Nathan', date: '2026-10-01' },
    review: { by: 'Nathan', date: '2026-10-02' },
    ...overrides,
  });
  return { slug: 'thu-dieu', data, body };
}

describe('§8.5 checklist', () => {
  it('passes a complete reading', () => {
    const r = checkReading(record(), measured, 2026);
    expect(r.items.filter((i) => !i.ok)).toEqual([]);
    expect(r.publishable).toBe(true);
  });
  it('fails each item for the right reason', () => {
    const failing = (overrides: Record<string, unknown>, body?: string, speed = measured) =>
      checkReading(record(overrides, body), speed, 2026).items.filter((i) => !i.ok).map((i) => i.n);
    expect(failing({ source: { name: 'x', url: null } })).toEqual([1]);
    expect(failing({ authors: [{ name: 'Ai đó', died: null }] })).toEqual([2, 3]);
    expect(failing({ translators: [{ name: 'Trần Trọng Kim', died: 1953 }] })).toEqual([2, 3]);
    expect(failing({ copyright: { vn: 'free', au: 'free', us: 'protected' } })).toEqual([3]);
    expect(failing({}, 'vì nhân-dân')).toEqual([5]);
    expect(failing({}, 'hoà bình')).toEqual([5]);
    expect(failing({ proofread: null })).toEqual([6]);
    expect(failing({}, undefined, { ...measured, measured: false })).toEqual([7]);
    expect(failing({ heavy: null })).toEqual([8]);
    expect(failing({ review: null })).toEqual([9]);
  });
  it('a passing draft is not publishable until status is published', () => {
    expect(checkReading(record({ status: 'draft' }), measured, 2026).publishable).toBe(false);
  });
});

describe('build gate (rule 4: never publish a reading that fails §8.5)', () => {
  const draft = { ...record({ status: 'draft', review: null }), slug: 'draft-one' };
  const good = record();
  it('production keeps only publishable readings', () => {
    expect(buildViews([draft, good], {}, measured, false, 2026).map((v) => v.slug)).toEqual(['thu-dieu']);
  });
  it('previews may include drafts, flagged as draft', () => {
    const views = buildViews([draft, good], {}, measured, true, 2026);
    expect(views.find((v) => v.slug === 'draft-one')?.draft).toBe(true);
  });
  it('throws if a file says published but fails the checklist', () => {
    const bad = record({ review: null });
    expect(() => buildViews([bad], {}, measured, false, 2026)).toThrow(/fail the §8.5 checklist/);
  });
});

describe('storage validation', () => {
  it('accepts only clean values', () => {
    expect(isSlugList(['thu-dieu'])).toBe(true);
    expect(isSlugList(['<script>'])).toBe(false);
    expect(isSlugList('x')).toBe(false);
    expect(isDailyState({ day: '2026-09-25', opens: ['a'] })).toBe(true);
    expect(isDailyState({ day: 'yesterday', opens: [] })).toBe(false);
  });
});
