import fs from 'node:fs';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { readingSchema } from '../../src/lib/schema';
import type { ReadingRecord } from '../../src/lib/checklist';

export const READINGS_DIR = path.resolve('src/content/readings');
export const FAME_FILE = path.resolve('data/fame.json');

export type RawFile = { slug: string; file: string; frontmatter: Record<string, unknown>; body: string };

export function splitFrontmatter(text: string): { frontmatter: Record<string, unknown>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error('missing front matter');
  return { frontmatter: (parse(m[1]!) ?? {}) as Record<string, unknown>, body: m[2]! };
}

export function joinFrontmatter(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n${body.replace(/^\n+/, '')}`;
}

export function readRawFiles(dir = READINGS_DIR): RawFile[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      return { slug: f.replace(/\.md$/, ''), file, ...splitFrontmatter(fs.readFileSync(file, 'utf8')) };
    });
}

export function readRecords(dir = READINGS_DIR): { records: ReadingRecord[]; invalid: { slug: string; error: string }[] } {
  const records: ReadingRecord[] = [];
  const invalid: { slug: string; error: string }[] = [];
  for (const raw of readRawFiles(dir)) {
    const parsed = readingSchema.safeParse(raw.frontmatter);
    if (parsed.success) records.push({ slug: raw.slug, data: parsed.data, body: raw.body });
    else invalid.push({ slug: raw.slug, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
  }
  return { records, invalid };
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function writeJson(file: string, value: unknown): void {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
