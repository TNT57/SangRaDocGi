/**
 * pnpm data:pageviews
 * For every reading in data/fame.json with a `wikiArticle`, sums vi.wikipedia pageviews over
 * the last 12 full months (CLAUDE.md §6.5) and stores them. Excerpts map to their parent work.
 * Needs network access to wikimedia.org.
 */
import type { FameTable } from '../src/lib/readings';
import { FAME_FILE, readJson, writeJson } from './lib/files';

const fame = readJson<FameTable>(FAME_FILE);
const now = new Date();
const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); // last day of previous month
const start = new Date(Date.UTC(end.getUTCFullYear() - 1, end.getUTCMonth() + 1, 1));
const fmt = (d: Date) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

const cache = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
for (const [slug, entry] of Object.entries(fame)) {
  const article = entry.wikiArticle;
  if (!article) {
    console.log(`skip ${slug}: no wikiArticle`);
    continue;
  }
  if (!cache.has(article)) {
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/vi.wikipedia/all-access/user/${encodeURIComponent(article.replace(/ /g, '_'))}/monthly/${fmt(start)}/${fmt(end)}`;
    let res: Response | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      res = await fetch(url, { headers: { 'user-agent': 'KetSach/0.1 (public-domain reading site; data prep script)' } });
      await sleep(1500);
      if (res.status !== 429) break;
      await sleep(Math.max(Number(res.headers.get('retry-after')) || 0, 5 * (attempt + 1)) * 1000);
    }
    if (!res?.ok) {
      console.log(`fail ${slug}: ${article} → HTTP ${res?.status}${res?.status === 404 ? ' (no such article: fix wikiArticle)' : ''}`);
      continue;
    }
    const body = (await res.json()) as { items: { views: number }[] };
    cache.set(article, body.items.reduce((s, i) => s + i.views, 0));
  }
  entry.pageviews12m = cache.get(article)!;
  entry.pageviewsFetchedOn = now.toISOString().slice(0, 10);
  console.log(`ok   ${slug}: ${article} → ${entry.pageviews12m}`);
}
writeJson(FAME_FILE, fame);
