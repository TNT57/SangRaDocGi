import type { Tier } from '../config/rarity';
import { themeLabel, type ThemeId } from '../config/themes';
import { genreLabel, type GenreId } from '../config/genres';
import { assignTiers, type FameInput } from './rarity';
import { checkReading, assertNoBadPublished, type CheckResult, type ReadingRecord } from './checklist';
import { flagsForPeople, type Flags } from './copyright';
import { parseBody, type ParsedBody } from './text/body';
import { countSyllables } from './text/syllables';
import { displayMinutes, readSeconds, type ReadingSpeed } from './text/readtime';
import type { PersonData } from './schema';

/** What a card needs (reel, popup, inventory). Small, because it is sent to the browser. */
export type CardData = {
  slug: string;
  title: string;
  author: string;
  theme: ThemeId;
  themeLabel: string;
  genre: GenreId;
  genreLabel: string;
  tier: Tier;
  minutes: number;
  heavy: boolean;
  draft: boolean;
};

export type ReadingView = CardData & {
  record: ReadingRecord;
  parsed: ParsedBody;
  syllables: number;
  seconds: number;
  computedFlags: Flags;
  check: CheckResult;
};

export type FameTable = Record<string, Partial<FameInput> & { wikiArticle?: string | null; pageviewsFetchedOn?: string | null }>;

export function personLine(p: PersonData): string {
  if (p.folk) return p.name;
  const range = `${p.born ?? '?'}–${p.died ?? ''}`;
  const years = p.born || p.died ? ` (${p.approx ? 'khoảng ' : ''}${range})` : '';
  return `${p.name}${years}`;
}

export function authorName(people: PersonData[]): string {
  return people.map((p) => p.name).join(', ');
}

/**
 * Turn raw records into views. Only publishable readings are kept, unless includeDrafts
 * (dev server or an explicit preview build). Tiers are ranked over the kept pool.
 */
export function buildViews(
  records: ReadingRecord[],
  fame: FameTable,
  speed: ReadingSpeed,
  includeDrafts: boolean,
  year = new Date().getFullYear(),
): ReadingView[] {
  const results = records.map((r) => checkReading(r, speed, year));
  assertNoBadPublished(results, records);

  const kept = records
    .map((record, i) => ({ record, check: results[i]! }))
    .filter(({ check }) => check.publishable || includeDrafts);

  const tiers = assignTiers(
    kept.map(({ record }) => ({
      slug: record.slug,
      fame: { textbookCount: fame[record.slug]?.textbookCount ?? null, pageviews12m: fame[record.slug]?.pageviews12m ?? null },
    })),
  );

  return kept
    .map(({ record, check }) => {
      const d = record.data;
      const parsed = parseBody(record.body, d.form);
      const syllables = countSyllables(parsed.plainText);
      const seconds = readSeconds(syllables, d.form, speed);
      return {
        slug: record.slug,
        title: d.title,
        author: authorName(d.authors),
        theme: d.theme,
        themeLabel: themeLabel(d.theme),
        genre: d.genre,
        genreLabel: genreLabel(d.genre),
        tier: tiers.get(record.slug) ?? 0,
        minutes: displayMinutes(seconds),
        heavy: d.heavy === true,
        draft: !check.publishable,
        record,
        parsed,
        syllables,
        seconds,
        computedFlags: flagsForPeople([...d.authors, ...d.translators, ...d.retellers], year),
        check,
      } satisfies ReadingView;
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'vi'));
}

export function toCard(v: ReadingView): CardData {
  const { slug, title, author, theme, themeLabel, genre, genreLabel, tier, minutes, heavy, draft } = v;
  return { slug, title, author, theme, themeLabel, genre, genreLabel, tier, minutes, heavy, draft };
}
