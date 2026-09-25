/**
 * pnpm data:fetch "<Wikisource page title>" --slug <slug> [--write]
 * Downloads the page from vi.wikisource.org, cleans it and normalises it.
 *  - If the reading file exists: shows the lines that differ from our text (proofreading aid).
 *    With --write, replaces the body and stores the source URL + revision id.
 *  - Otherwise: prints the text so you can create the file with pnpm data:new.
 * Needs network access to vi.wikisource.org.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { normalizeText } from '../src/lib/text/tone';
import { READINGS_DIR, joinFrontmatter, splitFrontmatter } from './lib/files';
import { cleanWikitext, diffLines, extractFromHtml } from './lib/wikitext';
import { pageUrl, parsePage } from './lib/wikisource';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { slug: { type: 'string' }, write: { type: 'boolean', default: false } } });
const title = positionals[0];
if (!title) {
  console.error('Usage: pnpm data:fetch "<Wikisource page title>" --slug <slug> [--write]');
  process.exit(1);
}

const page = await parsePage(title);
const text = normalizeText(extractFromHtml(page.text) || cleanWikitext(page.wikitext));
const url = pageUrl(page.title, page.revid);
console.log(`Fetched "${page.title}" (revision ${page.revid})\n${url}\n`);

const file = values.slug ? path.join(READINGS_DIR, `${values.slug}.md`) : null;
if (!file || !fs.existsSync(file)) {
  console.log(text);
  process.exit(0);
}

const { frontmatter, body } = splitFrontmatter(fs.readFileSync(file, 'utf8'));
const diffs = diffLines(body, text);
if (!diffs.length) console.log('Our text matches Wikisource line by line.');
for (const d of diffs) console.log(`line ${d.line}\n  ours:       ${d.ours}\n  wikisource: ${d.theirs}`);

if (values.write) {
  const source = { ...(frontmatter.source as object), name: 'Wikisource tiếng Việt', url, revision: page.revid };
  const notes = String(frontmatter.notes ?? '').includes('typed from memory')
    ? `Text replaced with the Wikisource copy (${diffs.length} line(s) differed from the earlier memory draft). Still proofread against a second copy.`
    : frontmatter.notes;
  fs.writeFileSync(file, joinFrontmatter({ ...frontmatter, source, notes }, `${text}\n`));
  console.log(`\nWrote ${path.relative(process.cwd(), file)}. Still proofread it against a second copy (§8.5 item 6).`);
}
