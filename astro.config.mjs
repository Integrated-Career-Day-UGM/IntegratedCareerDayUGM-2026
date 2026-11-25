// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// output: 'static' fits this content-driven, read-only event site.
// A backend, webhooks, or authenticated mutations would require switching to
// 'server' (or 'hybrid') — see docs/decisions/ADR-002. Do not add that until it
// is actually needed.
// 
const isDev = process.env.NODE_ENV !== 'production';

// Production canonical host. The local .env keeps PUBLIC_APP_URL on a
// localhost host, so never let that leak into a build: canonical, OG, and
// sitemap URLs must point at the public domain.
const PRODUCTION_SITE = 'https://www.icdugm26.app';
const configuredSite = process.env.PUBLIC_APP_URL;
const configuredSiteIsLocal =
  !configuredSite ||
  /^https?:\/\/(localhost|127\.0\.0\.1|kiri\.localhost)/i.test(configuredSite);

const resolvedSite =
  configuredSite && !configuredSiteIsLocal
    ? configuredSite
    : isDev
      ? 'http://kiri.localhost'
      : PRODUCTION_SITE;

export default defineConfig({
  site: resolvedSite,
  output: 'static',
  integrations: [react(), sitemap()],
  server: {
    host: true,
    port: 4321,
    allowedHosts: isDev ? ['.kiri.localhost', '.kiri.local'] : [],
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 500,
      },
      hmr: {
        clientPort:4321
      }
    },
    // @tailwindcss/vite ships Vite plugin typings built against a different
    // Vite minor than Astro pins; the runtime API is compatible, so cast at
    // the seam to keep `astro check`/tsc quiet.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
