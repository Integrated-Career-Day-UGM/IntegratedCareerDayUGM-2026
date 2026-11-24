import { event, getCompany, stageSessions, walkInSessions } from '../data';
import type { PosterInfo } from '../../types/map';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(event.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: event.timezone,
  });

/**
 * Companies participating in the selected day's walk-in interviews and stage
 * speaker sessions, rendered through the same poster shell as ICD_poster.
 */
export function getCompanyPosterItems(dayId: string): PosterInfo[] {
  const items = new Map<string, PosterInfo>();
  const add = (
    key: string,
    companyName: string,
    companyId: string | null,
    subtitle: string,
    accent: string,
  ) => {
    const company = companyId ? getCompany(companyId) : undefined;
    items.set(key, {
      id: key,
      title: company?.shortName ?? companyName,
      subtitle,
      src: company?.posterUrl ?? company?.logoUrl ?? '',
      accent,
    });
  };

  for (const session of walkInSessions) {
    if (session.dayId !== dayId) continue;
    add(
      session.companyId ?? `walkin-${session.id}`,
      session.companyName,
      session.companyId,
      `Walk-in · ${session.room} · ${formatTime(session.start)}`,
      '#ff2d6f',
    );
  }

  for (const session of stageSessions) {
    if (session.dayId !== dayId) continue;
    const company = getCompany(session.companyId);
    const speaker = session.speakers[0]?.name;
    add(
      session.companyId,
      company?.name ?? session.companyId,
      session.companyId,
      speaker
        ? `Stage · ${formatTime(session.start)} · ${speaker}`
        : `Stage · ${formatTime(session.start)}`,
      '#f0c71d',
    );
  }

  return [...items.values()];
}
