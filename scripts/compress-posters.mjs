import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

/**
 * Compress poster artwork for the map's Info tab.
 *
 * Drop event posters in `posters/source/` and company posters in
 * `posters/source/company-posters/`, then run `bun run compress:posters`.
 * WebP files land in `public/posters/` and `public/posters/companies/`.
 * WebP is the right tool here — gzip only shrinks the already-compressed
 * bytes and doesn't touch pixels.
 */
const SRC_DIR = 'posters/source';
const OUT_DIR = 'public/posters';
const COMPANY_SRC_DIR = 'posters/source/company-posters';
const COMPANY_OUT_DIR = 'public/posters/companies';
const MAX_WIDTH = 1400;
const QUALITY = 82;
const INPUT_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tif', '.tiff']);

/** Source names are human labels from the design team; public names are stable. */
const OUTPUT_NAMES = {
  'career-expo-21nov': 'career-expo',
  'walk-in-interview-18nov': 'walk-in-interview',
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function compressDirectory(srcDir, outDir, outputNames = {}) {
  await mkdir(outDir, { recursive: true });

  let entries = [];
  try {
    entries = await readdir(srcDir, { withFileTypes: true });
  } catch {
    console.log(`No ${srcDir}/ folder yet.`);
    return 0;
  }

  const files = entries
    .filter((entry) => entry.isFile() && INPUT_EXTENSIONS.has(extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);

  if (files.length === 0) {
    console.log(`No images in ${srcDir}/.`);
    return 0;
  }

  for (const file of files) {
    const input = join(srcDir, file);
    const sourceName = slugify(basename(file, extname(file)));
    const name = outputNames[sourceName] ?? sourceName;
    const output = join(outDir, `${name}.webp`);

    const metadata = await sharp(input).metadata();
    const width = metadata.width && metadata.width > MAX_WIDTH ? MAX_WIDTH : metadata.width;

    await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(output);

    const [before, after] = await Promise.all([stat(input), stat(output)]);
    console.log(`${srcDir}/${file}: ${kb(before.size)} → ${name}.webp: ${kb(after.size)}`);
  }

  return files.length;
}

async function main() {
  const eventCount = await compressDirectory(SRC_DIR, OUT_DIR, OUTPUT_NAMES);
  const companyCount = await compressDirectory(COMPANY_SRC_DIR, COMPANY_OUT_DIR);
  console.log(
    `[posters] ${eventCount} event + ${companyCount} company file(s) compressed`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
