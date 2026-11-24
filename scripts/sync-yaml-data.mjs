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
const oldCompanies = readJson('companies.json');
const oldBooths = readJson('booths.json');
const zones = readJson('zones.json');

const companyByName = new Map();
for (const company of oldCompanies) {
  const key = normalize(company.name);
  const previous = companyByName.get(key);
  if (!previous) {
    companyByName.set(key, company);
    continue;
  }
  // Keep one canonical row but merge mock openings from duplicate names.
  const openings = [...(previous.openings ?? [])];
  for (const opening of company.openings ?? []) {
    if (!openings.some((row) => row.title === opening.title && row.type === opening.type)) {
      openings.push(opening);
    }
  }
  companyByName.set(key, { ...previous, openings });
}

const companyIdByName = new Map();
const descriptionByName = new Map();
for (const row of boothsYaml.booths) {
  if (!row.company || !row.description) continue;
  descriptionByName.set(normalize(row.company), row.description);
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
      ? { ...existing, description: descriptionByName.get(key) ?? existing.description ?? null }
      : {
          id,
          name: row.company,
          shortName: row.company.replace(/^PT\s+/i, '').replace(/\s*\(Persero\).*$/i, ''),
          tags: [],
          websiteUrl: null,
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

console.log(
  `Synced YAML → JSON: ${companies.length} companies, ${booths.length} booths, ` +
    `${walkInSessions.length} walk-in bookings, ${stageSessions.length} stage sessions.`,
);
