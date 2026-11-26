import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

/**
 * Compress company poster art into two WebP sizes and write the runtime
 * manifest. Originals stay outside the repo:
 *
 *   POSTER_SOURCE_DIR="/posters-source" node scripts/import-company-posters.mjs
 *
 * Output:
 *   public/posters/companies/<companyId>/<slug>.webp
 *   public/posters/companies/<companyId>/<slug>.thumb.webp
 *   src/data/ugm-icd-2026/company-posters.json
 */
const SOURCE_DIR = process.env.POSTER_SOURCE_DIR || 'posters/source/company-posters';
const OUT_ROOT = 'public/posters/companies';
const MANIFEST = 'src/data/ugm-icd-2026/company-posters.json';
const COMPANIES = 'src/data/ugm-icd-2026/companies.json';
const FULL_WIDTH = 1600;
const THUMB_WIDTH = 480;
const FULL_QUALITY = 80;
const THUMB_QUALITY = 72;
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

const FOLDER_ALIASES = {
  'app group': 'e9-app',
  astra: 'c3-astra',
  dynapack: 'e12-dynapack',
  elnusa: 'e11-elnusa',
  monee: 'c2-monee',
  ocbc: 'e14-ocbc',
  'ocbc new': 'e14-ocbc',
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

const slug = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const titleFromPath = (relativePath) => {
  const withoutExtension = relativePath.slice(0, -extname(relativePath).length);
  const parts = withoutExtension.split(sep);
  const file = parts.pop() ?? '';
  const kind = parts[0] && /visit booth|apply now/i.test(parts[0]) ? parts[0] : null;
  const cleaned = file
    .replace(/^copy of\s+/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\bpage \d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return kind ? `${kind} · ${cleaned}` : cleaned;
};

const kindFromPath = (relativePath) => {
  const first = relativePath.split(sep)[0] ?? '';
  if (/visit booth/i.test(first)) return 'visit-booth';
  if (/apply now/i.test(first)) return 'apply-now';
  return 'gallery';
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

const companies = JSON.parse(readFileSync(COMPANIES, 'utf8'));
const companyById = new Map(companies.map((company) => [company.id, company]));
const usedIds = new Set();
const items = [];
let totalBytes = 0;

const files = (await walk(SOURCE_DIR)).sort();
for (const file of files) {
  const relativePath = relative(SOURCE_DIR, file);
  const companyFolder = relativePath.split(sep)[0];
  const companyId = FOLDER_ALIASES[companyFolder.toLowerCase()];
  const company = companyId ? companyById.get(companyId) : null;
  if (!companyId || !company) {
    console.warn(`[posters] skip (unmapped company folder): ${relativePath}`);
    continue;
  }

  const outputDir = join(OUT_ROOT, companyId);
  await mkdir(outputDir, { recursive: true });

  const baseSlug = slug(relativePath.slice(0, -extname(relativePath).length));
  let outputSlug = baseSlug;
  let suffix = 2;
  while (usedIds.has(`${companyId}-${outputSlug}`)) {
    outputSlug = `${baseSlug}-${suffix++}`;
  }
  usedIds.add(`${companyId}-${outputSlug}`);

  const fullPath = join(outputDir, `${outputSlug}.webp`);
  const thumbPath = join(outputDir, `${outputSlug}.thumb.webp`);

  const image = sharp(file).rotate();
  const metadata = await image.metadata();
  const width = metadata.width && metadata.width > FULL_WIDTH ? FULL_WIDTH : metadata.width;

  await image
    .clone()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: FULL_QUALITY, effort: 5 })
    .toFile(fullPath);

  await image
    .clone()
    .resize({ width: Math.min(THUMB_WIDTH, width ?? THUMB_WIDTH), withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY, effort: 5 })
    .toFile(thumbPath);

  const [fullStat, thumbStat] = await Promise.all([stat(fullPath), stat(thumbPath)]);
  totalBytes += fullStat.size + thumbStat.size;

  const publicPath = (path) =>
    `/${path.replace(/^public[\\/]/, '').replaceAll(sep, '/')}`;

  items.push({
    id: `${companyId}-${outputSlug}`,
    companyId,
    companyName: company.name,
    companyShortName: company.shortName,
    kind: kindFromPath(relativePath),
    title: titleFromPath(relativePath),
    src: publicPath(fullPath),
    thumbUrl: publicPath(thumbPath),
    downloadUrl: publicPath(fullPath),
    bytes: fullStat.size,
    thumbBytes: thumbStat.size,
  });
}

items.sort(
  (a, b) => a.companyId.localeCompare(b.companyId) || a.title.localeCompare(b.title),
);
await writeFile(MANIFEST, `${JSON.stringify(items, null, 2)}\n`);

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
console.log(
  `[posters] ${items.length} posters from ${files.length} files; ` +
    `full+thumb ${mb(totalBytes)} MB; manifest ${MANIFEST}`,
);
