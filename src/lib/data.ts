import eventJson from '../data/ugm-icd-2026/event.json';
import venuesJson from '../data/ugm-icd-2026/venues.json';
import zonesJson from '../data/ugm-icd-2026/zones.json';
import boothsJson from '../data/ugm-icd-2026/booths.json';
import companiesJson from '../data/ugm-icd-2026/companies.json';
import careerFairJson from '../data/ugm-icd-2026/career-fair.json';
import stageSessionsJson from '../data/ugm-icd-2026/stage-sessions.json';
import walkInSessionsJson from '../data/ugm-icd-2026/walk-in-sessions.json';
import quickfindJson from '../data/ugm-icd-2026/quickfind.json';
import uiJson from '../data/ugm-icd-2026/ui.json';
import registrationJson from '../data/ugm-icd-2026/registration.json';
import facilitiesJson from '../data/ugm-icd-2026/facilities.json';
import postersJson from '../data/ugm-icd-2026/posters.json';
import companyPostersJson from '../data/ugm-icd-2026/company-posters.json';
import type {
  EventConfig,
  Venue,
  Zone,
  Booth,
  Company,
  JobOpening,
  Session,
  StageSession,
  WalkInSession,
  QuickFindItem,
  Area,
  Track,
  UiStrings,
  FacilityInfo,
  PosterInfo,
  CompanyPoster,
  CareerFairFile,
} from '../types/map';

export const event: EventConfig = eventJson as EventConfig;
export const venues: Venue[] = venuesJson as Venue[];
export const zones: Zone[] = zonesJson as Zone[];
export const booths: Booth[] = boothsJson as Booth[];
const careerFairFile = careerFairJson as CareerFairFile;
export const careerFairMeta = careerFairFile.meta;
const openingsByCompany = new Map<string, JobOpening[]>();
for (const opening of careerFairFile.items) {
  const list = openingsByCompany.get(opening.companyId) ?? [];
  list.push(opening);
  openingsByCompany.set(opening.companyId, list);
}
/** Compressed company gallery posters generated from the external source. */
export const companyPosters: CompanyPoster[] = companyPostersJson as CompanyPoster[];
const postersByCompany = new Map<string, CompanyPoster[]>();
for (const poster of companyPosters) {
  const list = postersByCompany.get(poster.companyId) ?? [];
  list.push(poster);
  postersByCompany.set(poster.companyId, list);
}

export const companies: Company[] = (companiesJson as Company[]).map((company) => {
  const profile = careerFairFile.profiles?.[company.id];
  return {
    ...company,
    description: profile?.description ?? company.description,
    profile,
    posters: postersByCompany.get(company.id) ?? [],
    openings: openingsByCompany.get(company.id) ?? [],
  };
});
export const stageSessions: StageSession[] = stageSessionsJson as StageSession[];
export const walkInSessions: WalkInSession[] = walkInSessionsJson as WalkInSession[];

/**
 * Track-shaped sessions assembled from the generated YAML sources. There is no
 * hand-maintained sessions.json anymore; walk-ins and stage talks are the only
 * real scheduled sessions.
 */
export const sessions: Session[] = [
  ...walkInSessions.map((booking) => ({
    id: booking.id,
    areaId: 'hall-b',
    companyId: booking.companyId ?? '',
    trackId: 'walk-in-interview',
    dayId: booking.dayId,
    start: booking.start,
    end: booking.end,
    title: 'Walk-in Interview',
  })),
  ...stageSessions.map((session) => ({
    id: session.id,
    areaId: 'panggung',
    companyId: session.companyId,
    trackId: 'stage',
    dayId: session.dayId,
    start: session.start,
    end: session.end,
    title: session.title,
  })),
];
export const quickfind: QuickFindItem[] = quickfindJson as QuickFindItem[];
export const ui: UiStrings = uiJson as UiStrings;

/** Registration entry points (outside the map's own state — pure links). */
export type RegistrationLinks = {
  ugm: { label: string; hint: string; url: string };
  nonUgm: { label: string; hint: string; url: string };
};
export const registration = registrationJson as RegistrationLinks;

/** Facility markers on the floor plan (entrance, registration, …). */
export const facilities: Record<string, FacilityInfo> =
  facilitiesJson as Record<string, FacilityInfo>;

/** Poster folder on the mobile Info tab. */
export const posters: PosterInfo[] = postersJson as PosterInfo[];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}

export function getArea(venueId: string, areaId: string): Area | undefined {
  const venue = getVenue(venueId);
  return venue?.areas.find((a) => a.id === areaId);
}

export function getTrack(id: string): Track | undefined {
  return event.tracks.find((t) => t.id === id);
}

export function getZonesByArea(areaId: string): Zone[] {
  return zones.filter((z) => z.areaId === areaId);
}

export function getZone(zoneId: string): Zone | undefined {
  return zones.find((z) => z.id === zoneId);
}

/**
 * "Today" in the event's timezone, resolved lazily ONCE per page load (the
 * client island runs after the HTML arrives) and cached at module scope —
 * never recalculated on re-render or affected by later state changes.
 */
let cachedTodayDayId: string | null | undefined;

/**
 * "Today" in the event's timezone as an ISO date (YYYY-MM-DD), resolved lazily
 * ONCE per page load and cached at module scope — never recalculated on
 * re-render or affected by later state changes.
 */
let cachedTodayIso: string | null | undefined;

export function getTodayIso(): string | null {
  if (cachedTodayIso !== undefined) return cachedTodayIso;
  cachedTodayIso = null;
  try {
    cachedTodayIso = new Intl.DateTimeFormat('en-CA', {
      timeZone: event.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    cachedTodayIso = null;
  }
  return cachedTodayIso;
}

export function getTodayDayId(): string | null {
  if (cachedTodayDayId !== undefined) return cachedTodayDayId;
  const todayIso = getTodayIso();
  cachedTodayDayId = todayIso
    ? (event.days.find((d) => d.date === todayIso)?.id ?? null)
    : null;
  return cachedTodayDayId;
}

export function getBoothsByArea(areaId: string): Booth[] {
  return booths.filter((b) => b.areaId === areaId);
}

export function getBooth(id: string): Booth | undefined {
  return booths.find((b) => b.id === id);
}

/** Walk-in YAML stores booth codes (E13, D2); resolve them to booth ids. */
export function getBoothByCode(code: string): Booth | undefined {
  const key = code.trim().toLowerCase();
  return booths.find((b) => b.code.toLowerCase() === key);
}

export function getCompany(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function getSessionsByArea(areaId: string): Session[] {
  return sessions.filter((s) => s.areaId === areaId);
}

/** Speaking slots on the panggung stage held by one company. */
export function getStageSessionsByCompany(companyId: string): StageSession[] {
  return stageSessions.filter((s) => s.companyId === companyId);
}

/**
 * Walk-in bookings (walk-in.yaml) for one company. Unrostered companies
 * (companyId null in the sheet, e.g. PT Hakaaston) match by their sheet
 * name so their bookings still resolve.
 */
export function getWalkInSessionsByCompany(
  companyId: string | null,
  companyName?: string,
): WalkInSession[] {
  return walkInSessions.filter(
    (s) =>
      (companyId !== null && s.companyId === companyId) ||
      (companyId === null &&
        companyName !== undefined &&
        s.companyName === companyName),
  );
}

/**
 * Every booking for one room on one day, earliest first — a bilik can host
 * several companies across the day's slots (walk-in.yaml).
 */
export function getWalkInBookings(dayId: string, room: string): WalkInSession[] {
  return walkInSessions
    .filter((s) => s.dayId === dayId && s.room === room)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** The earliest booking for one room on one day, if any. */
export function getWalkInBooking(dayId: string, room: string): WalkInSession | undefined {
  return getWalkInBookings(dayId, room)[0];
}


export function getBoothsByZone(zoneId: string): Booth[] {
  return booths.filter((b) => b.zoneId === zoneId);
}

export function getCompanyForBooth(boothId: string): Company | undefined {
  const booth = getBooth(boothId);
  if (!booth?.companyId) return undefined;
  return getCompany(booth.companyId);
}
