/**
 * pnpm data:normalize [--hyphens] [slug ...]
 * NFC + one tone-mark style (src/lib/text/tone.ts) for titles and bodies.
 * --hyphens also turns old spelling "nhân-dân" into "nhân dân" (check proper names by hand).
 */
import fs from 'node:fs';
import { modernizeHyphens, normalizeText, findHyphenated } from '../src/lib/text/tone';
import { joinFrontmatter, readRawFiles } from './lib/files';

const args = process.argv.slice(2);
const hyphens = args.includes('--hyphens');
const only = args.filter((a) => !a.startsWith('--'));

let changed = 0;
for (const raw of readRawFiles()) {
  if (only.length && !only.includes(raw.slug)) continue;
  let body = normalizeText(raw.body);
  if (hyphens) body = modernizeHyphens(body);
  const title = typeof raw.frontmatter.title === 'string' ? normalizeText(raw.frontmatter.title) : raw.frontmatter.title;
  if (body !== raw.body || title !== raw.frontmatter.title) {
    fs.writeFileSync(raw.file, joinFrontmatter({ ...raw.frontmatter, title }, body));
    console.log(`normalized ${raw.slug}`);
    changed++;
  }
  const left = findHyphenated(body);
  if (left.length) console.log(`  ${raw.slug}: hyphenated words left: ${left.slice(0, 5).join(', ')} (use --hyphens)`);
}
console.log(`${changed} file(s) changed.`);
