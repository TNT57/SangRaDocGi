/**
 * pnpm data:qvtd-import [--list]
 * Turns the cached Quốc văn trích diễm pages (pnpm data:qvtd-fetch) into DRAFT readings.
 *   --list   print number, title, author and first line of every piece (to fill data/qvtd-map.json)
 * data/qvtd-map.json gives each piece its theme (and optionally genre, or skip: true).
 * Nothing is published: every file is status: draft, proofread: null, review: null (CLAUDE.md rule 4).
 */
import fs from 'node:fs';
import path from 'node:path';
import { flagsForPeople } from '../src/lib/copyright';
import { THEME_IDS, type ThemeId } from '../src/config/themes';
import { GENRE_IDS, type GenreId } from '../src/config/genres';
import { normalizeText } from '../src/lib/text/tone';
import { FAME_FILE, READINGS_DIR, joinFrontmatter, readJson, readRawFiles, writeJson } from './lib/files';
import { QVTD_PAGES, looksLucBat, modernizeSpelling, sentenceCase, slugify, splitPieces } from './lib/qvtd';
import { pageUrl, type Parsed } from './lib/wikisource';

type Author = { name: string; born?: number; died: number | null; approx?: boolean };
type MapEntry = { theme?: ThemeId; genre?: GenreId; skip?: boolean; title?: string; translated?: boolean; translator?: string; flag?: string };

const CACHE = path.resolve('data/cache/wikisource');
const authors = readJson<Record<string, Author | string>>('data/qvtd-authors.json');
const mapFile = path.resolve('data/qvtd-map.json');
const map: Record<string, MapEntry> = fs.existsSync(mapFile) ? readJson(mapFile) : {};
const listOnly = process.argv.includes('--list');

type Piece = {
  number: string; page: string; revid: number; title: string; body: string; form: 'prose' | 'verse' | 'luc-bat';
  author: Author | null; authorRaw: string; scans: string[]; quality: number; unsure: string[];
};

const pieces: Piece[] = [];
const missing: string[] = [];
for (const page of QVTD_PAGES) {
  const file = path.join(CACHE, `${encodeURIComponent(page)}.json`);
  if (!fs.existsSync(file)) {
    missing.push(page);
    continue;
  }
  const p = JSON.parse(fs.readFileSync(file, 'utf8')) as Parsed;
  const part = /\|\s*phần\s*=\s*(.*)/.exec(p.wikitext)?.[1]?.trim() ?? '';
  const who = /\|\s*(?:ghi đè )?người đóng góp\s*=\s*(.*)/.exec(p.wikitext)?.[1]?.trim() ?? '';
  const authorRaw = (/\[\[[^|\]]*\|([^\]]+)\]\]/.exec(who)?.[1] ?? /\[\[(?:Tác gia:)?([^\]]+)\]\]/.exec(who)?.[1] ?? who).trim();
  const known = authors[authorRaw];
  const author = typeof known === 'object' ? known : null;
  const scans = [...new Set([...p.text.matchAll(/data-page-name="([^"]+)"/g)].map((m) => m[1]!))];
  const qualities = [...p.text.matchAll(/data-page-quality="(\d)"/g)].map((m) => Number(m[1]));
  const raw = splitPieces(p.text, /\/(\d+)$/.exec(page)?.[1]);
  for (const r of raw) {
    const headerTitle = raw.length === 1 ? part.replace(/^\s*\d+(?:-\d+)?\s*\.?\s*—\s*/, '') : '';
    const spelled = modernizeSpelling(`${headerTitle || sentenceCase(r.heading)}\n${r.body}`);
    const [title, ...lines] = normalizeText(spelled.text).split('\n');
    const body = lines.join('\n').trim();
    const form = r.kind === 'prose' ? 'prose' : looksLucBat(body) ? 'luc-bat' : 'verse';
    pieces.push({
      number: r.number, page: p.title, revid: p.revid, title: title!.trim(), body, form, author, authorRaw,
      scans, quality: qualities.length ? Math.min(...qualities) : 0, unsure: spelled.unsure,
    });
  }
}

if (listOnly) {
  for (const x of pieces) {
    const first = x.body.split('\n').find((l) => l.trim()) ?? '';
    console.log(`${x.number}\t${x.title}\t${x.authorRaw || '?'}\t${x.form}\t${x.body.split(/\s+/).length}w\t${first.slice(0, 70)}`);
  }
  if (missing.length) console.log(`\nNot downloaded yet: ${missing.length} pages`);
  process.exit(0);
}

const existing = new Map(readRawFiles().map((f) => [f.slug, f]));
const byTitle = new Map(readRawFiles().map((f) => [String(f.frontmatter.title).toLocaleLowerCase('vi'), f]));
const fame = readJson<Record<string, unknown>>(FAME_FILE);
const written = new Set<string>();
const report = { created: 0, replacedMemoryDrafts: [] as string[], skipped: [] as string[], unmapped: [] as string[], unknownAuthors: new Set<string>() };

for (const x of pieces) {
  const m = map[x.number];
  if (!m?.theme) {
    report.unmapped.push(x.number);
    continue;
  }
  if (m.skip) continue;
  if (!THEME_IDS.includes(m.theme)) throw new Error(`qvtd-map ${x.number}: unknown theme ${m.theme}`);
  const genre: GenreId = m.genre ?? (x.form === 'prose' ? 'nghi-luan' : 'tho');
  if (!GENRE_IDS.includes(genre)) throw new Error(`qvtd-map ${x.number}: unknown genre ${genre}`);
  const title = m.title ?? x.title;

  // A draft typed from memory with the same title is replaced by the sourced text.
  const twin = byTitle.get(title.toLocaleLowerCase('vi'));
  let slug = slugify(title) || `qvtd-${x.number}`;
  if (twin && String(twin.frontmatter.notes ?? '').includes('typed from memory')) {
    slug = twin.slug;
    report.replacedMemoryDrafts.push(slug);
  } else if (existing.has(slug)) {
    const own = String(existing.get(slug)!.frontmatter.notes ?? '').includes(`Quốc văn trích diễm, bài ${x.number}.`);
    if (!own) slug = `${slug}-qvtd-${x.number}`;
    if (existing.has(slug) && !String(existing.get(slug)!.frontmatter.notes ?? '').includes(`Quốc văn trích diễm, bài ${x.number}.`)) {
      report.skipped.push(`${x.number} (${slug} exists)`);
      continue;
    }
  }
  // Two pieces with the same title in this run (e.g. two poems "Ông phỗng đá").
  if (written.has(slug)) slug = `${slug}-qvtd-${x.number}`;
  written.add(slug);
  const prev = existing.get(slug)?.frontmatter;
  if (prev && (prev.review || prev.proofread || prev.status === 'published')) {
    report.skipped.push(`${x.number} (${slug} already proofread/reviewed; not touched)`);
    continue;
  }

  const person = x.author ?? { name: x.authorRaw || 'Chưa rõ tác giả', died: null };
  if (!x.author) report.unknownAuthors.add(x.authorRaw || `(none) bài ${x.number}`);
  // Written in Hán, printed in translation: the translator's death year decides too (§8.3).
  const namedTranslator = m.translator ? authors[m.translator] : undefined;
  const translators: Author[] = m.translator
    ? [typeof namedTranslator === 'object' ? namedTranslator : { name: m.translator, died: null }]
    : m.translated
      ? [{ name: 'Chưa rõ người dịch (bản dịch in trong Quốc văn trích diễm)', died: null }]
      : [];
  const frontmatter = {
    title,
    status: 'draft',
    theme: m.theme,
    genre,
    form: x.form,
    authors: [person],
    translators,
    retellers: [],
    source: {
      name: 'Quốc văn trích diễm (Dương Quảng Hàm, in lần thứ tư 1930), Wikisource',
      url: pageUrl(x.page, x.revid),
      revision: x.revid,
      edition: `bài ${x.number}`,
    },
    copyright: flagsForPeople([person, ...translators]),
    heavy: null,
    hook: null,
    proofread: null,
    review: null,
    notes: [
      `Imported from Quốc văn trích diễm, bài ${x.number}.`,
      `Theme proposed by Claude: confirm.`,
      ...(m.flag ? [`Check: ${m.flag}`] : []),
      ...(m.translated ? ['Originally written in Hán; the translator is not named. It cannot pass §8.3 until the translator and their death year are known.'] : []),
      ...(m.translator ? [`Nôm version traditionally attributed to ${m.translator} (some say Phan Huy Ích, d. 1822); both are safe.`] : []),
      x.quality < 3 ? `Wikisource marks this transcription as not proofread (quality ${x.quality}/4): compare with the scan.` : `Wikisource quality ${x.quality}/4.`,
      `Scan: ${x.scans.map((s) => pageUrl(s)).join(' ')}`,
      `Old hyphenated spelling was modernised automatically.${x.unsure.length ? ` Check capitals at line starts: ${x.unsure.slice(0, 8).join(', ')}.` : ''}`,
      `The 1930 edition's footnotes were removed (never copy textbook notes).`,
    ].join(' '),
  };
  fs.writeFileSync(path.join(READINGS_DIR, `${slug}.md`), joinFrontmatter(frontmatter, `${x.body}\n`));
  fame[slug] ??= { textbookCount: null, wikiArticle: null, pageviews12m: null, pageviewsFetchedOn: null };
  report.created++;
}
writeJson(FAME_FILE, fame);

console.log(`Wrote ${report.created} draft readings from ${pieces.length} pieces.`);
if (report.replacedMemoryDrafts.length) console.log(`Replaced memory drafts with sourced text: ${report.replacedMemoryDrafts.join(', ')}`);
if (report.skipped.length) console.log(`Skipped: ${report.skipped.join('; ')}`);
if (report.unmapped.length) console.log(`No theme in data/qvtd-map.json for: ${report.unmapped.join(', ')}`);
if (report.unknownAuthors.size) console.log(`Authors not in data/qvtd-authors.json (death year unknown → fails §8.5 item 2): ${[...report.unknownAuthors].join('; ')}`);
if (missing.length) console.log(`Not downloaded yet: ${missing.length} pages (run pnpm data:qvtd-fetch)`);
