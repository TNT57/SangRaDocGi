import type { ReadingData } from './schema';
import { flagsForPeople, looserThanComputed, safeEverywhere } from './copyright';
import { isNormalized, findHyphenated } from './text/tone';
import { parseBody } from './text/body';
import type { ReadingSpeed } from './text/readtime';

/** CLAUDE.md §8.5 — a reading may go live only if all nine items pass. */
export type CheckItem = { n: number; label: string; ok: boolean; detail?: string };
export type CheckResult = { slug: string; items: CheckItem[]; passed: boolean; publishable: boolean };

export type ReadingRecord = { slug: string; data: ReadingData; body: string };

export function checkReading(rec: ReadingRecord, speed: ReadingSpeed, year = new Date().getFullYear()): CheckResult {
  const d = rec.data;
  const people = [...d.authors, ...d.translators, ...d.retellers];
  const computed = flagsForPeople(people, year);
  const parsed = parseBody(rec.body, d.form);

  const missingDeath = people.filter((p) => !p.folk && p.died === null).map((p) => p.name);
  const looser = d.copyright ? looserThanComputed(d.copyright, computed) : [];
  const textOk = isNormalized(rec.body) && isNormalized(d.title);

  const items: CheckItem[] = [
    { n: 1, label: 'Free source, link stored', ok: !!d.source.url, detail: d.source.url ? undefined : 'source.url is empty' },
    {
      n: 2,
      label: 'Author/translator + death year, VN/AU/US flags stored',
      ok: missingDeath.length === 0 && d.copyright !== null && looser.length === 0,
      detail: [
        missingDeath.length ? `no death year: ${missingDeath.join(', ')}` : '',
        d.copyright === null ? 'copyright flags not stored' : '',
        looser.length ? `stored flags looser than rule for: ${looser.join(', ')}` : '',
      ].filter(Boolean).join('; ') || undefined,
    },
    {
      n: 3,
      label: 'Passes "safe everywhere" rule',
      ok: safeEverywhere(computed) && d.copyright !== null && safeEverywhere(d.copyright),
      detail: safeEverywhere(computed) ? undefined : `computed VN=${computed.vn} AU=${computed.au} US=${computed.us}`,
    },
    { n: 4, label: 'One theme and one genre', ok: !!d.theme && !!d.genre },
    {
      n: 5,
      label: 'Unicode NFC, one tone style, no hyphenated old spelling',
      ok: textOk && parsed.errors.length === 0,
      detail: [
        !textOk ? 'run pnpm data:normalize' : '',
        findHyphenated(rec.body).slice(0, 3).join(', '),
        ...parsed.errors,
      ].filter(Boolean).join('; ') || undefined,
    },
    { n: 6, label: 'Proofread against a second copy', ok: d.proofread !== null },
    { n: 7, label: 'Read time measured', ok: speed.measured, detail: speed.measured ? undefined : 'data/reading-speed.json not measured yet' },
    { n: 8, label: 'Content tag decided', ok: d.heavy !== null },
    { n: 9, label: 'Reviewed by Nathan (name + date)', ok: d.review !== null },
  ];

  const passed = items.every((i) => i.ok);
  return { slug: rec.slug, items, passed, publishable: passed && d.status === 'published' };
}

/** A file marked published that fails the checklist is a hard error (CLAUDE.md rule 4). */
export function assertNoBadPublished(results: CheckResult[], records: ReadingRecord[]): void {
  const bad = results.filter((r, i) => records[i]!.data.status === 'published' && !r.passed);
  if (bad.length) {
    const lines = bad.map((r) => `  ${r.slug}: fails ${r.items.filter((i) => !i.ok).map((i) => `#${i.n}`).join(', ')}`);
    throw new Error(`Readings marked "published" fail the §8.5 checklist:\n${lines.join('\n')}`);
  }
}
