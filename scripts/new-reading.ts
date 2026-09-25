/**
 * pnpm data:new <slug> --title "Thu điếu" --author "Nguyễn Khuyến" --born 1835 --died 1909 \
 *   --theme thien-nhien --genre tho --form verse [--source-url URL]
 * Creates src/content/readings/<slug>.md as a draft, ready to paste the text into.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { flagsForPeople } from '../src/lib/copyright';
import { THEME_IDS } from '../src/config/themes';
import { FORMS, GENRE_IDS } from '../src/config/genres';
import { normalizeText } from '../src/lib/text/tone';
import { FAME_FILE, READINGS_DIR, joinFrontmatter, readJson, writeJson } from './lib/files';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string' },
    author: { type: 'string' },
    born: { type: 'string' },
    died: { type: 'string' },
    folk: { type: 'boolean', default: false },
    theme: { type: 'string' },
    genre: { type: 'string' },
    form: { type: 'string', default: 'verse' },
    'source-url': { type: 'string' },
    'source-name': { type: 'string', default: 'Wikisource tiếng Việt' },
  },
});

const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};
const slug = positionals[0] ?? fail('Missing slug.');
if (!/^[a-z0-9-]+$/.test(slug)) fail('Usage: pnpm data:new <slug-in-ascii-with-dashes> --title ... --author ... --died ... --theme ... --genre ...');
if (!values.title || !values.author) fail('--title and --author are required');
if (!THEME_IDS.includes(values.theme as never)) fail(`--theme must be one of: ${THEME_IDS.join(', ')}`);
if (!GENRE_IDS.includes(values.genre as never)) fail(`--genre must be one of: ${GENRE_IDS.join(', ')}`);
if (!FORMS.includes(values.form as never)) fail(`--form must be one of: ${FORMS.join(', ')}`);

const file = path.join(READINGS_DIR, `${slug}.md`);
if (fs.existsSync(file)) fail(`${file} already exists`);

const died = values.died ? Number(values.died) : null;
const author = { name: values.author!, ...(values.born ? { born: Number(values.born) } : {}), died, ...(values.folk ? { folk: true } : {}) };
const frontmatter = {
  title: normalizeText(values.title!),
  status: 'draft',
  theme: values.theme,
  genre: values.genre,
  form: values.form,
  authors: [author],
  translators: [],
  retellers: [],
  source: { name: values['source-name'], url: values['source-url'] ?? null },
  copyright: flagsForPeople([author]),
  heavy: null,
  hook: null,
  proofread: null,
  review: null,
};
fs.writeFileSync(file, joinFrontmatter(frontmatter, 'Dán văn bản vào đây. Dòng trống = khổ thơ / đoạn mới.\n'));
const fame = readJson<Record<string, unknown>>(FAME_FILE);
fame[slug] ??= { textbookCount: null, wikiArticle: null, pageviews12m: null, pageviewsFetchedOn: null };
writeJson(FAME_FILE, fame);
console.log(`Created ${path.relative(process.cwd(), file)}. Next: paste the text, then pnpm data:normalize ${slug} and pnpm data:check.`);
