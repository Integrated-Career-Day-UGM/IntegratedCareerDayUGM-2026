import eventJson from '../data/ugm-icd-2026/event.json';
import venuesJson from '../data/ugm-icd-2026/venues.json';
import zonesJson from '../data/ugm-icd-2026/zones.json';
import boothsJson from '../data/ugm-icd-2026/booths.json';
import companiesJson from '../data/ugm-icd-2026/companies.json';
import sessionsJson from '../data/ugm-icd-2026/sessions.json';
import quickfindJson from '../data/ugm-icd-2026/quickfind.json';
import uiJson from '../data/ugm-icd-2026/ui.json';
import type {
  EventConfig,
  Venue,
  Zone,
  Booth,
  Company,
  Session,
  QuickFindItem,
  Area,
  Track,
  UiStrings,
} from '../types/map';

export const event: EventConfig = eventJson as EventConfig;
export const venues: Venue[] = venuesJson as Venue[];
export const zones: Zone[] = zonesJson as Zone[];
export const booths: Booth[] = boothsJson as Booth[];
export const companies: Company[] = companiesJson as Company[];
export const sessions: Session[] = sessionsJson as Session[];
export const quickfind: QuickFindItem[] = quickfindJson as QuickFindItem[];
export const ui: UiStrings = uiJson as UiStrings;

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

export function getTodayDayId(): string | null {
  if (cachedTodayDayId !== undefined) return cachedTodayDayId;
  cachedTodayDayId = null;
  try {
    const todayIso = new Intl.DateTimeFormat('en-CA', {
      timeZone: event.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    cachedTodayDayId = event.days.find((d) => d.date === todayIso)?.id ?? null;
  } catch {
    cachedTodayDayId = null;
  }
  return cachedTodayDayId;
}

export function getBoothsByArea(areaId: string): Booth[] {
  return booths.filter((b) => b.areaId === areaId);
}

export function getBooth(id: string): Booth | undefined {
  return booths.find((b) => b.id === id);
}

export function getCompany(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function getSessionsByArea(areaId: string): Session[] {
  return sessions.filter((s) => s.areaId === areaId);
}

export function getSession(id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

export function getBoothsByZone(zoneId: string): Booth[] {
  return booths.filter((b) => b.zoneId === zoneId);
}

export function getCompanyForBooth(boothId: string): Company | undefined {
  const booth = getBooth(boothId);
  if (!booth?.companyId) return undefined;
  return getCompany(booth.companyId);
}
