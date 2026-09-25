/**
 * pnpm data:qvtd-fetch
 * Downloads (and caches in data/cache/) every numbered piece of Quốc văn trích diễm
 * (Dương Quảng Hàm, 4th edition 1930) from vi.wikisource. Safe to rerun: cached pages are skipped.
 */
import { parsePage } from './lib/wikisource';
import { QVTD_PAGES } from './lib/qvtd';

let i = 0;
for (const title of QVTD_PAGES) {
  await parsePage(title);
  if (++i % 20 === 0) console.log(`${i}/${QVTD_PAGES.length}`);
}
console.log(`cached ${QVTD_PAGES.length} pages`);
