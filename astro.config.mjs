// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';

// Site address for canonical links: SITE_URL if set, else the Vercel production domain
// (set automatically by Vercel during builds), else localhost.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:4321');

// Pages are static. Only src/pages/api/counter.ts runs on the server (CLAUDE.md §6.3, §11).
export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  integrations: [preact()],
  trailingSlash: 'never',
});
