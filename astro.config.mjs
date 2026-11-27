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
    build: {
      rollupOptions: {
        output: {
          // Isolate maplibre-gl so UI edits never change its chunk hash.
          // Must be the FUNCTION form: Astro wraps output.manualChunks and
          // silently ignores the object form ({ 'vendor': ['pkg'] }).
          manualChunks(id) {
            if (!/node_modules[\\/]maplibre-gl[\\/]/.test(id)) return;
            // Keep the stylesheet on the island chunk — moving it here would
            // drop its <link> from map.html and collapse the container.
            if (id.endsWith('.css')) return;
            return 'maplibre-vendor';
          },
        },
      },
    },
    server: {
      watch: {
        usePolling: true,
        interval: 60000,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
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
