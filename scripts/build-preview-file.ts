/**
 * pnpm preview:file
 * Packs the whole site (with drafts) into ONE self-contained HTML file:
 * dist-preview/ket-sach-preview.html. Fonts, CSS and JS are inlined, so it opens anywhere
 * (a Claude artifact, an email attachment, a double-click). Private previews only: it
 * contains unreviewed drafts (CLAUDE.md rule 4).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { buildViews, toCard, type FameTable } from '../src/lib/readings';
import { readingSpeed } from '../src/lib/text/readtime';
import { FAME_FILE, readJson, readRecords } from './lib/files';

const STATIC = path.resolve('.vercel/output/static');
const OUT_DIR = path.resolve('dist-preview');
const OUT = path.join(OUT_DIR, 'ket-sach-preview.html');

if (!process.argv.includes('--no-build')) {
  execSync('pnpm build', { stdio: 'inherit', env: { ...process.env, INCLUDE_DRAFTS: '1' } });
}

// 1. Pages: every index.html becomes a hidden section keyed by its route.
function findPages(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '_astro' ? [] : findPages(full);
    return e.name === 'index.html' ? [full] : [];
  });
}

const sections = findPages(STATIC)
  .sort()
  .map((file) => {
    const html = fs.readFileSync(file, 'utf8');
    const dir = path.relative(STATIC, path.dirname(file));
    const route = dir ? `/${dir.split(path.sep).join('/')}` : '/';
    const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? 'Két Sách';
    let body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
    body = body
      .replace(/<script\b[\s\S]*?<\/script>/g, '')
      .replace(/<astro-island\b[\s\S]*<\/astro-island>/, '<div id="crate-root"></div>');
    return `<div data-route="${route}" data-title="${title}"${route === '/' ? '' : ' hidden'}>${body}</div>`;
  });

// 2. CSS with fonts inlined (woff2 only; every browser that runs the site supports it).
const astroDir = path.join(STATIC, '_astro');
const css = fs
  .readdirSync(astroDir)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(astroDir, f), 'utf8'))
  .join('\n')
  .replace(/,\s*url\(\/_astro\/[^)]+\.woff\)\s*format\(["']woff["']\)/g, '')
  .replace(/url\(\/_astro\/([^)]+\.woff2)\)/g, (_, name: string) => {
    const data = fs.readFileSync(path.join(astroDir, name)).toString('base64');
    return `url(data:font/woff2;base64,${data})`;
  });

// 3. JS: the crate island + a tiny page switcher, bundled into one script.
const { records } = readRecords();
const pool = buildViews(records, readJson<FameTable>(FAME_FILE), readingSpeed, true).map(toCard);
const js = await build({
  entryPoints: ['scripts/preview/runtime.tsx'],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  jsx: 'automatic',
  jsxImportSource: 'preact',
  define: { __POOL__: JSON.stringify(pool) },
  target: 'es2020',
});
const script = js.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script');

const page = `<title>Két Sách</title>
<meta name="robots" content="noindex,nofollow">
<style>${css}</style>
${sections.join('\n')}
<script>${script}</script>
`;
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, page);
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${(page.length / 1024).toFixed(0)} KB, ${sections.length} pages, ${pool.length} readings)`);
