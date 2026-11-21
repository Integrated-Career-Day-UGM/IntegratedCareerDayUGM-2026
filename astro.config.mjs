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

export default defineConfig({
  site: process.env.PUBLIC_APP_URL ?? (isDev ? 'http://kiri.localhost' : 'http://localhost:4321'),
  output: 'static',
  integrations: [react(), sitemap()],
  server: {
    host: true,
    port: 4321,
    allowedHosts: isDev ? ['.kiri.localhost', '.kiri.local'] : [],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
