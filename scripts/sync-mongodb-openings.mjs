import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MongoClient } from 'mongodb';

/**
 * Best-effort openings sync.
 *
 * Contract: this script NEVER fails a deploy. Any Mongo/network/mapping
 * problem is logged and the previous openings.json is left untouched. If no
 * previous file exists, an honest empty file with status "unavailable" is
 * written so the UI can show a generic state (never technical errors).
 *
 * Required env:
 *   MONGODB_URI
 *   MONGODB_DB
 *   MONGODB_OPENINGS_COLLECTION
 *
 * Run: node scripts/sync-mongodb-openings.mjs
 */

const ROOT = 'src/data/ugm-icd-2026';
const OPENINGS_PATH = join(ROOT, 'openings.json');
const COMPANIES_PATH = join(ROOT, 'companies.json');
const BOOTHS_PATH = join(ROOT, 'booths.json');

try {
  process.loadEnvFile?.('.env');
} catch {
  // .env is optional; deployment env vars are enough.
}

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const slug = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function existingFile() {
  try {
    return readJson(OPENINGS_PATH);
  } catch {
    return null;
  }
}

function writeUnavailable() {
  const existing = existingFile();
  if (existing) {
    console.warn('[openings] sync skipped; keeping last known good openings.json');
    return;
  }
  writeFileSync(
    OPENINGS_PATH,
    `${JSON.stringify(
      { meta: { updatedAt: null, status: 'unavailable' }, items: [] },
      null,
      2,
    )}\n`,
  );
  console.warn('[openings] sync unavailable; wrote an empty openings.json');
}

function writeOpenings(items) {
  const payload = {
    meta: { updatedAt: new Date().toISOString(), status: 'ok' },
    items,
  };
  writeFileSync(OPENINGS_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function mapCompanyIndexes() {
  const companies = readJson(COMPANIES_PATH);
  const booths = readJson(BOOTHS_PATH);
  const byId = new Map();
  const byName = new Map();
  const byBooth = new Map();
  for (const company of companies) {
    byId.set(company.id, company);
    byName.set(normalize(company.name), company);
    for (const alias of [company.shortName].filter(Boolean)) {
      byName.set(normalize(alias), company);
    }
  }
  for (const booth of booths) {
    if (booth.companyId) byBooth.set(String(booth.code).toUpperCase(), booth.companyId);
  }
  return { byId, byName, byBooth };
}

function resolveCompanyId(doc, indexes) {
  if (doc.companyId && indexes.byId.has(doc.companyId)) return doc.companyId;
  if (doc.boothCode) {
    const byBooth = indexes.byBooth.get(String(doc.boothCode).toUpperCase());
    if (byBooth) return byBooth;
  }
  if (doc.companyName) {
    const company = indexes.byName.get(normalize(doc.companyName));
    if (company) return company.id;
  }
  return null;
}

function toIsoDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeOpening(doc, companyId, indexes) {
  const company = indexes.byId.get(companyId);
  const title = String(doc.title ?? '').trim();
  const type = String(doc.type ?? '').trim();
  if (!title || !type) return null;

  const id =
    String(doc.id ?? doc._id ?? '').trim() ||
    `${companyId}-${slug(title)}-${slug(type)}`;

  return {
    id,
    companyId,
    title,
    type,
    description: doc.description ? String(doc.description) : null,
    location: doc.location ? String(doc.location) : null,
    deadline: toIsoDate(doc.deadline),
    applyUrl: doc.applyUrl ? String(doc.applyUrl) : null,
    posterUrl: doc.posterUrl ? String(doc.posterUrl) : null,
    posterDownloadUrl: doc.posterDownloadUrl ? String(doc.posterDownloadUrl) : null,
    updatedAt: toIsoDate(doc.updatedAt),
    isMock: Boolean(doc.isMock),
    dataSource: doc.dataSource ? String(doc.dataSource) : 'mongodb',
    availableDays: Array.isArray(doc.availableDays) ? doc.availableDays.map(String) : [],
    companyName: company?.name ?? null,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  const collectionName = process.env.MONGODB_OPENINGS_COLLECTION ?? 'openings';
  const includeMock = process.env.OPENINGS_INCLUDE_MOCK
    ? process.env.OPENINGS_INCLUDE_MOCK === 'true'
    : process.env.NODE_ENV !== 'production';

  if (!uri || !dbName) {
    console.warn('[openings] MONGODB_URI/MONGODB_DB missing; sync skipped');
    writeUnavailable();
    return;
  }

  const indexes = mapCompanyIndexes();
  const timeout = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS ?? 10000);
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: Number.isFinite(timeout) ? timeout : 10000,
  });

  try {
    await client.connect();
    const docs = await client
      .db(dbName)
      .collection(collectionName)
      .find({})
      .toArray();

    const items = [];
    let unmatched = 0;
    let invalid = 0;
    let excludedMock = 0;
    for (const doc of docs) {
      if (
        !includeMock &&
        (doc.isMock === true ||
          doc.dataSource === 'seed' ||
          doc.dataSource === 'mock')
      ) {
        excludedMock += 1;
        continue;
      }
      const companyId = resolveCompanyId(doc, indexes);
      if (!companyId) {
        unmatched += 1;
        continue;
      }
      const opening = normalizeOpening(doc, companyId, indexes);
      if (!opening) {
        invalid += 1;
        continue;
      }
      items.push(opening);
    }

    // Production intentionally excludes seeded mock rows. If every document
    // was mock, this is a valid empty state, not a sync failure.
    if (docs.length > 0 && excludedMock === docs.length) {
      writeOpenings([]);
      console.log(
        `[openings] excluded ${excludedMock} mock openings; no real openings`,
      );
      return;
    }

    if (docs.length > 0 && items.length === 0) {
      console.warn(
        `[openings] ${docs.length} docs found but none mapped (unmatched=${unmatched}, invalid=${invalid}); UI will use the generic unavailable state`,
      );
      writeUnavailable();
      return;
    }

    items.sort(
      (a, b) =>
        String(a.companyId).localeCompare(String(b.companyId)) ||
        a.title.localeCompare(b.title),
    );
    writeOpenings(items);
    console.log(
      `[openings] synced ${items.length} openings` +
        (excludedMock ? ` (excluded ${excludedMock} mock)` : '') +
        (unmatched ? ` (skipped ${unmatched} unmatched)` : '') +
        (invalid ? ` (skipped ${invalid} invalid)` : ''),
    );
  } catch (error) {
    console.warn(
      `[openings] sync failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    writeUnavailable();
  } finally {
    await client.close().catch(() => {});
  }
}

mkdirSync(ROOT, { recursive: true });
await main().catch((error) => {
  console.warn(
    `[openings] unexpected sync failure: ${error instanceof Error ? error.message : String(error)}`,
  );
  writeUnavailable();
});
process.exitCode = 0;
