// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';

// Pages are static. Only src/pages/api/counter.ts runs on the server (CLAUDE.md §6.3, §11).
export default defineConfig({
  site: process.env.SITE_URL || 'https://ket-sach.vercel.app',
  output: 'static',
  adapter: vercel(),
  integrations: [preact()],
  trailingSlash: 'never',
  build: { format: 'file' },
});
