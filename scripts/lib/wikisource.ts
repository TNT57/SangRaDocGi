import fs from 'node:fs';
import path from 'node:path';

/**
 * Polite Wikisource API client (run with NODE_USE_ENV_PROXY=1 behind a proxy): identifies itself, waits between calls, backs off on 429,
 * and caches every answer in data/cache/ (gitignored) so a rerun works offline.
 */
const UA = 'KetSach/0.1 (public-domain reading site; data prep script)';
const API = 'https://vi.wikisource.org/w/api.php';
const CACHE = path.resolve('data/cache/wikisource');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Parsed = { title: string; revid: number; wikitext: string; text: string };

export async function parsePage(title: string, { refresh = false } = {}): Promise<Parsed> {
  const file = path.join(CACHE, `${encodeURIComponent(title)}.json`);
  if (!refresh && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')) as Parsed;
  const params = new URLSearchParams({
    action: 'parse', page: title, prop: 'text|wikitext|revid', format: 'json', formatversion: '2',
    redirects: '1', disableeditsection: '1', disablelimitreport: '1',
  });
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(`${API}?${params}`, { headers: { 'user-agent': UA } });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      await sleep(Math.max(retryAfter * 1000, 10_000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Wikisource ${res.status} for ${title}`);
    const json = (await res.json()) as { parse?: Parsed; error?: { info: string } };
    if (!json.parse) throw new Error(`${title}: ${json.error?.info ?? 'not found'}`);
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(json.parse));
    await sleep(3000);
    return json.parse;
  }
  throw new Error(`Wikisource kept rate-limiting ${title}`);
}

export function pageUrl(title: string, revid?: number): string {
  const base = `https://vi.wikisource.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/')}`;
  return revid ? `${base}?oldid=${revid}` : base;
}
