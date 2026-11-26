import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

/**
 * Hash ORIGINAL full-resolution poster files and stage them for R2 upload.
 *
 * Users download the originals (JPG/PNG from the design team), not the
 * display-quality WebP that lives in public/posters/companies/.
 *
 * Usage:
 *   node scripts/prepare-r2-posters.mjs
 *   # or override source dir:
 *   POSTER_SOURCE_DIR="E:\grinding\Integrated Career Day\posters" node scripts/prepare-r2-posters.mjs
 *
 * What it does:
 *   1. Walks POSTER_SOURCE_DIR (defaults to the sibling `posters/` folder next
 *      to the repo) for every image file (jpg, jpeg, png, pdf).
 *   2. Maps company folder names → companyId via FOLDER_ALIASES (same as
 *      import-company-posters.mjs).
 *   3. Computes MD5 of the original bytes, takes the first 8 hex chars.
 *   4. Copies renamed originals into .tmp/r2-posters-orig/ (gitignored) with
 *      key: `orig/<companyId>/<slug>-<hash8>.<ext>`
 *   5. Writes src/data/ugm-icd-2026/poster-r2-manifest.json with r2Key + r2Url
 *      for every poster, keyed by companyId + slugged filename.
 *
 * After running: upload .tmp/r2-posters-orig/ to R2 via rclone — see docs/r2-sync.md
 */

// Default: sibling `posters/` folder one level above the repo root.
// Override with POSTER_SOURCE_DIR env var.
const SOURCE_DIR =
  process.env.POSTER_SOURCE_DIR ??
  join(import.meta.dirname, '..', '..', 'posters');

const OUT_DIR = '.tmp/r2-posters-orig';
const R2_MANIFEST = 'src/data/ugm-icd-2026/poster-r2-manifest.json';

// Your public R2 base URL — update when you have a custom domain.
const BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? 'https://posters.icdugm26.app';

// Same mapping as import-company-posters.mjs
const FOLDER_ALIASES = {
  'app group': 'e9-app',
  astra: 'c3-astra',
  dynapack: 'e12-dynapack',
  elnusa: 'e11-elnusa',
  monee: 'c2-monee',
  'ocbc new': 'e14-ocbc',
  ocbc: 'e14-ocbc',
  odoo: 'c4-odoo',
  'paragon corp': 'd1-paragon',
  polygon: 'd3-polygon',
  'pt bank negara indonesia (persero) tbk': 'd2-bni',
  'pt cobra dental indonesia': 'e10-cobra',
  'quick traktor': 'cv-karya-hidup-sentosa-quick-traktor',
  'surya internusa': 'e2-surya',
  'teach first indonesia': 'e13-teachfirst',
  torrecid: 'e8-torrecid',
  zurich: 'c6-zurich',
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.pdf']);

const slug = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const md5slice = (buffer, len = 8) =>
  createHash('md5').update(buffer).digest('hex').slice(0, len);

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`[r2-posters] Source directory not found: ${SOURCE_DIR}`);
    console.error(`[r2-posters] Set POSTER_SOURCE_DIR env var to point at your originals.`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const allFiles = (await walk(SOURCE_DIR)).sort();
  const r2Entries = [];
  let staged = 0;
  let totalBytes = 0;
  let skipped = 0;

  for (const filePath of allFiles) {
    const relativePath = relative(SOURCE_DIR, filePath);
    const parts = relativePath.split(sep);

    // Top-level files (not in a company subfolder) → treat as event posters
    const isNested = parts.length > 1;
    const companyFolder = isNested ? parts[0].toLowerCase() : null;
    const companyId = companyFolder ? (FOLDER_ALIASES[companyFolder] ?? null) : 'event';

    if (isNested && !companyId) {
      console.warn(`[r2-posters] skip (unmapped company folder): ${relativePath}`);
      skipped++;
      continue;
    }

    const fileName = parts.at(-1);
    const ext = extname(fileName).toLowerCase();
    const baseName = fileName.slice(0, -ext.length);
    const fileSlug = slug(baseName);

    const buffer = await readFile(filePath);
    const hash = md5slice(buffer);

    // R2 key: orig/<companyId>/<slug>-<hash8>.<ext>
    const r2Key = `orig/${companyId}/${fileSlug}-${hash}${ext}`;
    const r2Url = `${BASE_URL}/${r2Key}`;

    // Stage the original file (preserving extension — full quality)
    const destPath = join(OUT_DIR, 'orig', companyId, `${fileSlug}-${hash}${ext}`);
    await mkdir(join(OUT_DIR, 'orig', companyId), { recursive: true });
    await copyFile(filePath, destPath);

    const { size } = await stat(filePath);
    totalBytes += size;
    staged++;

    r2Entries.push({
      id: `${companyId}-${fileSlug}`,
      companyId: companyId === 'event' ? null : companyId,
      originalFile: relativePath.replaceAll(sep, '/'),
      ext: ext.replace('.', ''),
      r2Key,
      r2Url,
      bytes: size,
    });

    console.log(`  ${companyId}/${fileSlug}-${hash}${ext}  (${(size / 1024).toFixed(0)} KB)`);
  }

  const manifest = {
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    note: 'Full-resolution originals served from R2. Display WebP lives in public/posters/companies/.',
    posters: r2Entries,
  };

  await writeFile(R2_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  const mb = (b) => (b / 1024 / 1024).toFixed(2);
  console.log('');
  console.log(`[r2-posters] ${staged} originals staged in ${OUT_DIR}/`);
  if (skipped) console.log(`[r2-posters] ${skipped} files skipped (unmapped company folder)`);
  console.log(`[r2-posters] Total original size: ${mb(totalBytes)} MB`);
  console.log(`[r2-posters] Manifest → ${R2_MANIFEST}`);
  console.log(`[r2-posters] Next: rclone copy ${OUT_DIR} r2-icd:icd-posters — see docs/r2-sync.md`);
}

main().catch((err) => {
  console.error('[r2-posters] Error:', err);
  process.exit(1);
});
