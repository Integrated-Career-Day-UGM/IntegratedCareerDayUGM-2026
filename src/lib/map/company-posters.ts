import { companies, event, getCompany, stageSessions, walkInSessions } from '../data';
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
    // A company without a poster simply has no gallery node. Do not fall
    // back to the logo or an empty skeleton card.
    if (!company?.posterUrl) return;
    items.set(key, {
      id: key,
      title: company.shortName ?? companyName,
      subtitle,
      src: company.posterUrl,
      accent,
      downloadUrl: company.posterDownloadUrl ?? undefined,
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

  // Every company with a poster gets a gallery slot even when it has no
  // walk-in/stage session. Session companies keep their richer subtitle;
  // the rest use the company name.
  const represented = new Set(items.keys());
  for (const company of companies) {
    if (!company.posterUrl || represented.has(company.id)) continue;
    items.set(`company-${company.id}`, {
      id: `company-${company.id}`,
      title: company.shortName,
      subtitle: company.name,
      src: company.posterUrl,
      accent: '#5b7f3a',
      downloadUrl: company.posterDownloadUrl ?? undefined,
    });
  }

  // Lowongan posters live in the same company carousel so a detail-page
  // "Open in Info" can reveal them by a stable opening id.
  for (const company of companies) {
    for (const opening of company.openings) {
      if (!opening.posterUrl) continue;
      items.set(opening.id, {
        id: opening.id,
        title: company.shortName,
        subtitle: opening.title,
        src: opening.posterUrl,
        accent: '#f0c71d',
        downloadUrl: opening.posterDownloadUrl ?? undefined,
      });
    }
  }

  return [...items.values()];
}
