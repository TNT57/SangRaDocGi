/**
 * pnpm data:syllables [slug ...]
 * Prints the syllable count (§8.4 unit) of each reading. Use it when timing your reading speed:
 * speed = syllables ÷ minutes you took.
 */
import { parseBody } from '../src/lib/text/body';
import { countSyllables } from '../src/lib/text/syllables';
import { readRecords } from './lib/files';

const only = process.argv.slice(2);
for (const r of readRecords().records) {
  if (only.length && !only.includes(r.slug)) continue;
  const n = countSyllables(parseBody(r.body, r.data.form).plainText);
  console.log(`${r.slug.padEnd(28)} ${String(n).padStart(6)} tiếng  (${r.data.form})`);
}
