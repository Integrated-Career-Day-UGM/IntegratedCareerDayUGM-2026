/**
 * Poster download helper using the R2 content-addressed manifest.
 *
 * The manifest (src/data/ugm-icd-2026/poster-r2-manifest.json) is statically
 * imported — no serverless function or presigned URL required. The browser
 * fetches the full-size original directly from the public R2 CDN bucket.
 *
 * Usage:
 *   import { downloadFullPoster } from '@/lib/posters/downloadPoster';
 *   downloadFullPoster('/posters/companies/c2-monee/monee-slide-1.webp', 'Monee - Slide 1');
 */

import manifest from '../../data/ugm-icd-2026/poster-r2-manifest.json';

type PosterR2Entry = {
  id: string;
  companyId: string | null;
  /** Display WebP path — only present in older manifests. */
  src?: string;
  /** Source path from the sync script, e.g. "Monee/Slide 1.jpg". */
  originalFile?: string;
  r2Key: string | null;
  r2Url: string | null;
  bytes: number | null;
};

type R2Manifest = {
  baseUrl: string;
  posters: PosterR2Entry[];
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const { posters } = manifest as R2Manifest;

// The manifest id drops the source folder prefix ("APP Group/Poster Hiring
// _page-0001.jpg" -> "e9-app-poster-hiring-page-0001") while the display
// poster id keeps the slugged full path. Match both by the display file's
// basename, which is the slug of `originalFile` for every entry.
const byBasename = new Map<string, PosterR2Entry>();
for (const entry of posters) {
  if (!entry.originalFile) continue;
  byBasename.set(slug(entry.originalFile.replace(/\.[^.]+$/, '')), entry);
}

/** Resolve the public R2 URL for a poster by its `id`, `src`, or src basename. */
export function getFullPosterR2Url(idOrSrc: string): string | null {
  const direct = posters.find((p) => p.id === idOrSrc || p.src === idOrSrc);
  if (direct) return direct.r2Url ?? null;

  const basename = (idOrSrc.split('/').at(-1) ?? idOrSrc).replace(/\.[^.]+$/, '');
  return byBasename.get(slug(basename))?.r2Url ?? null;
}

/**
 * Trigger a full-size poster download from R2 in the browser.
 *
 * A cross-origin `<a download>` is ignored by browsers (the object just opens
 * in a tab), so fetch the bytes first and save from a same-origin blob URL.
 * If the bucket's CORS policy blocks the fetch, fall back to opening the
 * object in a new tab instead of failing silently.
 *
 * @param idOrSrc   Poster `id` (from company-posters.json) or its `/posters/...` src path.
 * @param filename  Optional filename hint for the downloaded file.
 */
export async function downloadFullPoster(idOrSrc: string, filename?: string): Promise<void> {
  const url = getFullPosterR2Url(idOrSrc);
  if (!url) {
    console.warn(`[downloadPoster] No R2 URL found for: ${idOrSrc}`);
    return;
  }

  const urlName = url.split('/').at(-1) ?? 'poster.webp';
  const ext = /\.[a-z0-9]+$/i.test(urlName) ? urlName.slice(urlName.lastIndexOf('.')) : '';
  const name = filename
    ? /\.[a-z0-9]+$/i.test(filename)
      ? filename
      : `${filename}${ext}`
    : urlName;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const objectUrl = URL.createObjectURL(await response.blob());

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // The download reads the blob synchronously; release it on the next tick.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    console.warn('[downloadPoster] Blob download failed, opening in a new tab:', error);
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
