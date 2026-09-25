/**
 * pnpm data:check [--launch]
 * Prints the CLAUDE.md §8.5 checklist for every reading and the §9 launch readiness.
 * --launch exits with code 1 if the site is not ready to launch.
 */
import { checkReading } from '../src/lib/checklist';
import { readingSpeed } from '../src/lib/text/readtime';
import { THEMES } from '../src/config/themes';
import { CONTACT_EMAIL_PLACEHOLDER, site } from '../src/config/site';
import type { FameTable } from '../src/lib/readings';
import { FAME_FILE, readJson, readRecords } from './lib/files';

const LAUNCH_TOTAL = 100;
const LAUNCH_PER_THEME = 15;

const { records, invalid } = readRecords();
const fame = readJson<FameTable>(FAME_FILE);
const results = records.map((r) => checkReading(r, readingSpeed));

const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
console.log('\nKét Sách — §8.5 checklist (✓ pass, ✗ fail)\n');
console.log(`${pad('slug', 26)}${pad('status', 11)}1 2 3 4 5 6 7 8 9   theme`);
for (const [i, r] of results.entries()) {
  const rec = records[i]!;
  const marks = r.items.map((it) => (it.ok ? '✓' : '✗')).join(' ');
  const status = r.publishable ? 'LIVE' : rec.data.status;
  console.log(`${pad(r.slug, 26)}${pad(status, 11)}${marks}   ${rec.data.theme}`);
}

const details = results.flatMap((r) => r.items.filter((it) => !it.ok && it.detail).map((it) => `  ${r.slug} #${it.n}: ${it.detail}`));
if (details.length) console.log(`\nDetails:\n${[...new Set(details)].join('\n')}`);
if (invalid.length) console.log(`\nFiles that do not match the schema:\n${invalid.map((x) => `  ${x.slug}: ${x.error}`).join('\n')}`);

const live = results.filter((r) => r.publishable);
const perTheme = THEMES.map((t) => ({ ...t, n: live.filter((r) => records.find((x) => x.slug === r.slug)!.data.theme === t.id).length }));
const noFame = records.filter((r) => fame[r.slug]?.textbookCount == null || fame[r.slug]?.pageviews12m == null).map((r) => r.slug);
const badPublished = results.filter((r, i) => records[i]!.data.status === 'published' && !r.passed);

const checks = [
  { ok: live.length >= LAUNCH_TOTAL, text: `Readings live: ${live.length} / ${LAUNCH_TOTAL}` },
  ...perTheme.map((t) => ({ ok: t.n >= LAUNCH_PER_THEME, text: `  ${t.label}: ${t.n} / ${LAUNCH_PER_THEME}` })),
  { ok: readingSpeed.measured, text: `Reading speed measured (data/reading-speed.json)` },
  { ok: site.contactEmail !== CONTACT_EMAIL_PLACEHOLDER, text: `Contact email set (src/config/site.ts)` },
  { ok: noFame.length === 0, text: `Fame data complete (data/fame.json)${noFame.length ? ` — missing for ${noFame.length}: ${noFame.slice(0, 5).join(', ')}${noFame.length > 5 ? '…' : ''}` : ''}` },
  { ok: invalid.length === 0, text: 'All files match the schema' },
  { ok: badPublished.length === 0, text: 'No "published" file fails the checklist' },
];
console.log('\nLaunch readiness (CLAUDE.md §9):');
for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.text}`);
const ready = checks.every((c) => c.ok);
console.log(ready ? '\nReady to launch.\n' : '\nNot ready to launch yet.\n');
if (process.argv.includes('--launch') && !ready) process.exit(1);
if (invalid.length || badPublished.length) process.exit(1);
