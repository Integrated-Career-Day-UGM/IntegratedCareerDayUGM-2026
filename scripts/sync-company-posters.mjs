import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

/**
 * Fills `posterUrl` / `posterDownloadUrl` from files dropped into
 * `public/posters/companies/`. Name files by company id (`c2-monee.webp`) or
 * by a slugged name (`monee-indonesia.webp`). Existing URLs are left alone
 * when no local file matches.
 *
 * Usage: `bun run sync:posters`
 */
const companiesPath = 'src/data/ugm-icd-2026/companies.json';
const postersDir = join('public', 'posters', 'companies');
const rootPostersDir = join('public', 'posters');
const extensions = ['.webp', '.avif', '.png', '.jpg', '.jpeg'];

const slug = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const byBase = new Map();
const scanDirectories = [
  { dir: postersDir, rank: 0 },
  { dir: rootPostersDir, rank: 1 },
];
for (const { dir, rank } of scanDirectories) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    const extension = extname(file).toLowerCase();
    if (!extensions.includes(extension)) continue;
    const base = file.slice(0, -extension.length).toLowerCase();
    // The company folder wins over the root when both contain a match.
    const previous = byBase.get(base);
    if (previous && previous.rank <= rank) continue;
    byBase.set(base, { file, rank, directory: dir });
  }
}

const companies = JSON.parse(readFileSync(companiesPath, 'utf8'));
let updated = 0;

for (const company of companies) {
  const candidates = [
    company.id,
    slug(company.name),
    slug(company.shortName),
    slug(company.id).replace(/^[a-z]\d+-/, ''),
  ].filter(Boolean);

  const match = candidates
    .map((candidate) => byBase.get(candidate))
    .find(Boolean);

  if (!match) continue;

  const url =
    match.directory === postersDir
      ? `/posters/companies/${match.file}`
      : `/posters/${match.file}`;
  if (company.posterUrl !== url || company.posterDownloadUrl !== url) {
    company.posterUrl = url;
    company.posterDownloadUrl = url;
    updated += 1;
  }
}

writeFileSync(companiesPath, `${JSON.stringify(companies, null, 2)}\n`);
console.log(
  `[posters] ${updated} company rows updated from ${byBase.size} file(s) in ${postersDir}`,
);
