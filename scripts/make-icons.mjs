// Renders the home-screen icons (PNG) from the Két Sách mark. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

const mark = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#13151a"/>
  <g transform="translate(${pad} ${pad}) scale(${(100 - 2 * pad) / 32})" fill="none" stroke="#d9a441" stroke-width="1.6" stroke-linejoin="round">
    <rect x="3.5" y="4.5" width="25" height="22" rx="3.5"/>
    <path d="M8 9.5c2.6-.8 5.2-.8 8 .6 2.8-1.4 5.4-1.4 8-.6v11c-2.6-.8-5.2-.8-8 .6-2.8-1.4-5.4-1.4-8-.6z"/>
    <path d="M16 10.1v11"/>
    <path d="M8 26.5v1.5M24 26.5v1.5" stroke-linecap="round"/>
  </g>
</svg>`;

const jobs = [
  { file: 'public/icons/icon-192.png', size: 192, pad: 16 },
  { file: 'public/icons/icon-512.png', size: 512, pad: 16 },
  { file: 'public/icons/icon-maskable-512.png', size: 512, pad: 24 }, // stays inside Android's safe zone
  { file: 'public/icons/apple-touch-icon.png', size: 180, pad: 16 },
];
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath });
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${j.size}px;height:${j.size}px}</style>${mark(j.pad)}`);
  await page.screenshot({ path: j.file });
  await page.close();
}
await browser.close();
console.log('icons written');
