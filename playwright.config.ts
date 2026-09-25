import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Cloud sessions ship Chromium at /opt/pw-browsers/chromium; elsewhere Playwright's own is used.
const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    ...devices['Pixel 7'],
    launchOptions: executablePath ? { executablePath } : {},
  },
  // Preview build with drafts, served statically. The counter API is mocked in tests.
  webServer: {
    command: 'INCLUDE_DRAFTS=1 pnpm build && node scripts/serve-static.mjs',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
