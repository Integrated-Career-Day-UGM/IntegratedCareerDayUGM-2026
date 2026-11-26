import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

/**
 * YAML is the source of truth. This script regenerates the runtime JSON
 * (booths, companies, walk-in sessions, stage sessions, zone membership)
 * from the files in src/data/ugm-icd-2026/LO_data/.
 *
 * Run: `bun run sync:data`
 */
const ROOT = 'src/data/ugm-icd-2026';
const LO = join(ROOT, 'LO_data');

const readJson = (file) => JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
const readYaml = (file) => YAML.parse(readFileSync(join(LO, file), 'utf8'));
const writeJson = (file, value) =>
  writeFileSync(join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);

const normalize = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const slug = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const event = readJson('event.json');
const boothsYaml = readYaml('UGM-ICD-booths.yaml');
const walkInYaml = readYaml('UGM-ICD-walk-in.yaml');
const sessionsYaml = readYaml('UGM-ICD-sessions.yaml');
let openingDocs = [];
try {
  openingDocs = YAML.parseAllDocuments(
    readFileSync(join(LO, 'UGM-ICD-openings.yaml'), 'utf8'),
  )
    .map((document) => document.toJS())
    .filter((document) => document && typeof document === 'object' && !Array.isArray(document));
} catch {
  // The openings source is optional until the parsed company data lands.
}
const oldCompanies = readJson('companies.json');
const zones = readJson('zones.json');

const companyByName = new Map();
for (const company of oldCompanies) {
  const key = normalize(company.name);
  if (!companyByName.has(key)) {
    companyByName.set(key, company);
  }
}

const companyIdByName = new Map();
const descriptionByName = new Map();
const websiteByName = new Map();
for (const row of boothsYaml.booths) {
  if (!row.company) continue;
  if (row.description) descriptionByName.set(normalize(row.company), row.description);
  if (row.website) websiteByName.set(normalize(row.company), row.website);
}
const companies = [];
for (const row of boothsYaml.booths) {
  if (!row.company) continue;
  const key = normalize(row.company);
  if (companyIdByName.has(key)) continue;
  const existing = companyByName.get(key);
  const id = existing?.id ?? slug(row.company);
  companyIdByName.set(key, id);
  companies.push(
    existing
      ? {
          ...existing,
          description: descriptionByName.get(key) ?? existing.description ?? null,
          websiteUrl: websiteByName.get(key) ?? existing.websiteUrl ?? null,
          openings: [],
        }
      : {
          id,
          name: row.company,
          shortName: row.company.replace(/^PT\s+/i, '').replace(/\s*\(Persero\).*$/i, ''),
          tags: [],
          websiteUrl: websiteByName.get(key) ?? null,
          programUrl: null,
          logoUrl: null,
          posterUrl: null,
          description: descriptionByName.get(key) ?? null,
          openings: [],
        },
  );
}

const companyNameByBooth = new Map();
const boothIdByCode = new Map();
const booths = [];
for (const row of boothsYaml.booths) {
  const code = row.booth;
  const id = code.toLowerCase();
  boothIdByCode.set(code, id);
  companyNameByBooth.set(code, row.company ?? null);
  const prefix = code[0].toUpperCase();
  booths.push({
    id,
    areaId: 'hall-c1',
    zoneId: prefix === 'C' ? 'zone-c' : prefix === 'D' ? 'zone-d' : prefix === 'E' ? 'zone-e' : 'zone-a',
    code,
    label: code,
    companyId: row.company ? (companyIdByName.get(normalize(row.company)) ?? null) : null,
  });
}

const companyIdForBooth = (code) => {
  if (!code) return null;
  const boothId = boothIdByCode.get(code);
  if (!boothId) return null;
  return booths.find((booth) => booth.id === boothId)?.companyId ?? null;
};

// ─── Rich company / lowongan source ─────────────────────────────────────────
const coreName = (value) =>
  normalize(value)
    .replace(/\b(pt|tbk|persero)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const COMPANY_ALIASES = {
  'utpe-group': 'c3-astra',
  'astra': 'c3-astra',
  'quick-traktor': companyIdForBooth('E1'),
};

const companyById = new Map(companies.map((company) => [company.id, company]));
const companyByCore = new Map();
for (const company of companies) {
  companyByCore.set(coreName(company.name), company.id);
  companyByCore.set(coreName(company.shortName), company.id);
  companyByCore.set(coreName(company.id), company.id);
}
const companyByBoothCode = new Map();
for (const booth of booths) {
  if (booth.companyId) companyByBoothCode.set(booth.code.toUpperCase(), booth.companyId);
}

const resolveCompanyId = (doc) => {
  if (doc.companyId && companyById.has(doc.companyId)) return doc.companyId;
  if (doc.booth_ref) {
    const byBooth = companyByBoothCode.get(String(doc.booth_ref).trim().toUpperCase());
    if (byBooth) return byBooth;
  }
  if (doc.booth) {
    const byBooth = companyByBoothCode.get(String(doc.booth).trim().toUpperCase());
    if (byBooth) return byBooth;
  }
  if (doc.id && companyById.has(doc.id)) return doc.id;
  if (doc.id && COMPANY_ALIASES[doc.id] && companyById.has(COMPANY_ALIASES[doc.id])) {
    return COMPANY_ALIASES[doc.id];
  }
  const byName = companyIdByName.get(normalize(doc.company));
  if (byName) return byName;
  const byCore = companyByCore.get(coreName(doc.company));
  if (byCore) return byCore;
  const bySlug = companyById.has(slug(doc.company)) ? slug(doc.company) : null;
  if (bySlug) return bySlug;
  return null;
};

const deadlineFor = (dates) =>
  (dates ?? []).find((date) =>
    /deadline|batas|tutup|closing|penutupan/i.test(String(date.event ?? '')),
  ) ?? null;

const firstLink = (links) =>
  (links ?? []).find((link) => /^https?:\/\//i.test(String(link.url ?? ''))) ?? null;

// Profile-only companies (e.g. PP KAGAMA) live in booths.yaml. Openings
// documents override these fields when the same company appears there.
const profiles = {};
for (const row of boothsYaml.booths) {
  const companyId = row.booth ? companyIdForBooth(row.booth) : null;
  if (!companyId) continue;
  if (!row.category && !row.program_links && !row.cta && !row.important_dates) continue;
  profiles[companyId] = {
    description: row.description ?? null,
    categories: Array.isArray(row.category) ? row.category : [],
    importantDates: Array.isArray(row.important_dates) ? row.important_dates : [],
    programLinks: Array.isArray(row.program_links) ? row.program_links : [],
    cta: row.cta ?? null,
  };
}

const openingItems = [];
const openingIds = new Set();
let unmatchedCompanies = 0;

for (const doc of openingDocs) {
  const companyId = resolveCompanyId(doc);
  if (!companyId) {
    unmatchedCompanies += 1;
    continue;
  }
  const company = companyById.get(companyId);
  const links = doc.program_links ?? [];
  const primaryLink = firstLink(links);
  const deadline = deadlineFor(doc.important_dates);
  const deadlineLabel = deadline
    ? [deadline.date, deadline.time].filter(Boolean).join(' · ') || null
    : null;

  profiles[companyId] = {
    description: doc.desc ?? null,
    categories: Array.isArray(doc.category) ? doc.category : [],
    importantDates: Array.isArray(doc.important_dates) ? doc.important_dates : [],
    programLinks: links,
    cta: doc.cta ?? null,
  };

  for (const intake of doc.intakes ?? []) {
    for (const role of intake.roles ?? []) {
      const title = String(role.title ?? '').trim();
      if (!title) continue;
      let id = `${companyId}-${slug(intake.program)}-${slug(title)}`;
      let suffix = 2;
      while (openingIds.has(id)) id = `${companyId}-${slug(intake.program)}-${slug(title)}-${suffix++}`;
      openingIds.add(id);
      openingItems.push({
        id,
        companyId,
        title,
        type: String(intake.program ?? '').trim() || 'Opening',
        program: intake.program ?? null,
        intakeCount: intake.intake_count ?? null,
        description: role.job_desc_summary ?? null,
        location: role.location ?? null,
        deadline: null,
        deadlineLabel,
        applyUrl: primaryLink?.url ?? null,
        applyLabel: primaryLink?.label ?? null,
        posterUrl: company?.posterUrl ?? null,
        posterDownloadUrl: company?.posterDownloadUrl ?? null,
        qualifications: Array.isArray(role.qualification) ? role.qualification : [],
        preferences: Array.isArray(role.preferences) ? role.preferences : [],
        updatedAt: new Date().toISOString(),
        isMock: false,
        dataSource: 'yaml',
        availableDays: [],
        companyName: company?.name ?? doc.company ?? null,
      });
    }
  }
}

const careerFair = {
  meta: { updatedAt: new Date().toISOString(), status: 'ok' },
  profiles,
  items: openingItems,
};


const dayDate = new Map(
  event.days.map((day, index) => [`d${index + 1}`, day.date]),
);

const walkInSessions = [];
for (const day of walkInYaml.days) {
  const dayId = `d${day.day}`;
  const date = dayDate.get(dayId);
  for (const booking of day.bookings ?? []) {
    walkInSessions.push({
      id: `wi-${booking.room.toLowerCase()}-${dayId}`,
      dayId,
      companyId: companyIdForBooth(booking.booth_ref),
      companyName: booking.company,
      room: booking.room,
      boothRef: booking.booth_ref ?? null,
      start: `${date}T${booking.start}:00+07:00`,
      end: `${date}T${booking.end}:00+07:00`,
    });
  }
}

const stageSessions = [];
for (const [index, session] of (sessionsYaml.sessions ?? []).entries()) {
  const dayId = `d${session.day}`;
  const date = dayDate.get(dayId);
  const companyId = companyIdForBooth(session.booth_ref);
  if (!companyId) continue;
  stageSessions.push({
    id: `stage-${slug(session.company)}-${dayId}-${index}`,
    dayId,
    companyId,
    start: `${date}T${session.start}:00+07:00`,
    end: `${date}T${session.end}:00+07:00`,
    title: 'Company Session',
    speakers: (session.speakers ?? []).map((speaker) => ({
      name: speaker.name,
      title: speaker.title,
    })),
  });
}

const zoneBooths = { 'zone-a': [], 'zone-c': [], 'zone-d': [], 'zone-e': [] };
for (const booth of booths) {
  const key = booth.zoneId;
  if (zoneBooths[key]) zoneBooths[key].push(booth.id);
}
for (const zone of zones) {
  if (zoneBooths[zone.id]) zone.boothIds = zoneBooths[zone.id];
}

writeJson('companies.json', companies);
writeJson('booths.json', booths);
writeJson('walk-in-sessions.json', walkInSessions);
writeJson('stage-sessions.json', stageSessions);
writeJson('zones.json', zones);
writeJson('career-fair.json', careerFair);

console.log(
  `[sync:data] ${companies.length} companies, ${booths.length} booths, ` +
    `${walkInSessions.length} walk-in, ${stageSessions.length} stage, ` +
    `${openingItems.length} openings, ${Object.keys(profiles).length} profiles` +
    (unmatchedCompanies ? ` (${unmatchedCompanies} unmatched company docs)` : ''),
);
