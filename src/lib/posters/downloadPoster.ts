/**
 * Poster download helper using the R2 content-addressed manifest.
 *
 * The manifest (src/data/ugm-icd-2026/poster-r2-manifest.json) is statically
 * imported — no serverless function or presigned URL required. The browser
 * fetches the full-size WebP directly from the public R2 CDN bucket.
 *
 * Usage:
 *   import { downloadFullPoster } from '@/lib/posters/downloadPoster';
 *   downloadFullPoster('c2-monee-monee-slide-1', 'Monee Slide 1');
 */

import manifest from '../../data/ugm-icd-2026/poster-r2-manifest.json';

type PosterR2Entry = {
  id: string;
  companyId: string | null;
  src: string;
  r2Key: string | null;
  r2Url: string | null;
  bytes: number | null;
};

type R2Manifest = {
  baseUrl: string;
  posters: PosterR2Entry[];
};

const { posters } = manifest as R2Manifest;

/** Resolve the public R2 URL for a poster by its `id` or `/posters/...` src path. */
export function getFullPosterR2Url(idOrSrc: string): string | null {
  const entry = posters.find((p) => p.id === idOrSrc || p.src === idOrSrc);
  return entry?.r2Url ?? null;
}

/**
 * Trigger a full-size poster download from R2 in the browser.
 *
 * Strategy:
 * 1. Try a `<a download>` anchor pointing at the R2 URL.
 *    Works when the R2 bucket is on the same origin or has CORS + `Content-Disposition: attachment`.
 * 2. If CORS is not configured, falls back to opening the URL in a new tab
 *    so the browser download dialog still appears.
 *
 * @param idOrSrc   Poster `id` (from company-posters.json) or its `/posters/...` src path.
 * @param filename  Optional filename hint for the downloaded file.
 */
export function downloadFullPoster(idOrSrc: string, filename?: string): void {
  const url = getFullPosterR2Url(idOrSrc);
  if (!url) {
    console.warn(`[downloadPoster] No R2 URL found for: ${idOrSrc}`);
    return;
  }

  const name = filename ?? url.split('/').at(-1) ?? 'poster.webp';

  // Create a temporary anchor and click it.
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener noreferrer';
  // Fallback: open in new tab if the download attribute is blocked cross-origin.
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
