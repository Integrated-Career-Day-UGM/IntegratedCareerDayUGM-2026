import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

/**
 * Compress poster artwork for the map's Info tab.
 *
 * Drop originals in `posters/source/`, run `bun run compress:posters`, and
 * the WebP files land in `public/posters/` with the same base filename.
 * WebP is the right tool here — gzip only shrinks the already-compressed
 * bytes and doesn't touch pixels.
 */
const SRC_DIR = 'posters/source';
const OUT_DIR = 'public/posters';
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

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let entries = [];
  try {
    entries = await readdir(SRC_DIR, { withFileTypes: true });
  } catch {
    console.log(`No ${SRC_DIR}/ folder yet. Add poster originals there first.`);
    return;
  }

  const files = entries
    .filter((entry) => entry.isFile() && INPUT_EXTENSIONS.has(extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);

  if (files.length === 0) {
    console.log(`No images in ${SRC_DIR}/. Nothing to compress.`);
    return;
  }

  for (const file of files) {
    const input = join(SRC_DIR, file);
    const sourceName = slugify(basename(file, extname(file)));
    const name = OUTPUT_NAMES[sourceName] ?? sourceName;
    const output = join(OUT_DIR, `${name}.webp`);

    const metadata = await sharp(input).metadata();
    const width = metadata.width && metadata.width > MAX_WIDTH ? MAX_WIDTH : metadata.width;

    await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(output);

    const [before, after] = await Promise.all([stat(input), stat(output)]);
    console.log(`${file}: ${kb(before.size)} → ${name}.webp: ${kb(after.size)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
