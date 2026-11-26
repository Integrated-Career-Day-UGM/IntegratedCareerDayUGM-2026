import {
  event,
  getCompany,
  stageSessions,
} from '../../lib/data';
import { formatTime } from '../../lib/map/happening-carousel';

function dayHeading(dayId: string, index: number): string {
  const day = event.days.find((entry) => entry.id === dayId);
  if (!day) return dayId;
  const date = new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `Hari ${index + 1} · ${date}`;
}

/**
 * Panggung schedule — the company speaking slots generated from
 * UGM-ICD-sessions.yaml. Grouped by day, time first, no photos.
 */
export default function StageSchedule() {
  const groups = event.days
    .map((day, index) => ({
      day,
      label: dayHeading(day.id, index),
      rows: stageSessions
        .filter((session) => session.dayId === day.id)
        .sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .filter((group) => group.rows.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="mt-3 border-t border-line">
      <div className="section-label flex items-center justify-between px-3 py-2">
        <span>Stage schedule</span>
        <span className="tabular-nums">{stageSessions.length}</span>
      </div>

      {groups.map((group) => (
        <div key={group.day.id} className="border-t border-[#232326]">
          <div className="section-label border-b border-[#232326] px-3 py-1.5">
            {group.label}
          </div>
          <ul className="divide-y divide-[#232326]">
            {group.rows.map((session) => {
              const company = getCompany(session.companyId);
              const speakers = session.speakers
                .map((speaker) => speaker.name)
                .filter(Boolean);

              return (
                <li
                  key={session.id}
                  className="flex items-start gap-3 px-3 py-2.5"
                >
                  <span className="w-[72px] shrink-0 pt-0.5 text-[0.75rem] font-semibold leading-tight text-white tabular-nums md:text-[12px]">
                    {formatTime(session.start)}–{formatTime(session.end)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[0.875rem] font-semibold leading-snug text-white md:text-[13px]">
                      {company?.name ?? 'Company Session'}
                    </span>
                    {speakers.length > 0 && (
                      <span className="mt-0.5 block break-words text-[0.75rem] leading-snug text-[#8f8f8f] md:text-[11.5px]">
                        {speakers.join(' · ')}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
