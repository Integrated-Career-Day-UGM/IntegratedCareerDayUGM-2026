import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against `astro preview`, which serves the static build
// from dist/ on port 4321.
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    // Reuse a server that is already running. In CI the e2e job starts
    // `astro preview` from the downloaded dist/ artifact first, so the build
    // here only runs locally when no server is up yet.
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
