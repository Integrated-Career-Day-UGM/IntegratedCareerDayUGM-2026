import { useMemo } from 'react';
import {
  event,
  getArea,
  getSessionsByCompany,
  getStageSessionsByCompany,
  getTrack,
  getWalkInSessionsByCompany,
  ui,
} from '../../lib/data';
import { formatTime } from '../../lib/map/happening-carousel';
import { useMapStore } from '../../stores/mapStore';
import EmptyState from './EmptyState';

type SessionRow = {
  id: string;
  /** Marker label — the track (or stage) the session belongs to. */
  label: string;
  /** Main line — booking company or session title. */
  title: string;
  /** Place line — bilik, area name or speakers. */
  place: string;
  dayId: string;
  start: string;
  end: string;
  /** The row the user opened the card from (walk-in detail). */
  highlight: boolean;
  /** Walk-in bookings are links into the 2F plan; others are informational. */
  walkIn?: { room: string; dayId: string };
};

/** "28 Nov" for a day id, in the event locale (same format as the 2F plan). */
const dayLabel = (dayId: string) => {
  const day = event.days.find((d) => d.id === dayId);
  return day
    ? new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
    : '';
};

interface CompanySessionsProps {
  companyId: string | null;
  /** Sheet company name — resolves bookings for companies with no roster id. */
  companyName?: string;
  /** Booking id to highlight (the one the walk-in card was opened from). */
  highlightId?: string;
}

/**
 * Everything a company is doing beyond its booth: walk-in bookings
 * (walk-in.yaml), track sessions (sessions.yaml) and panggung speaking
 * slots — one chronological list, shown on the detail card whether it was
 * opened from the career-expo tab or the walk-in tab. Rows borrow the
 * HappeningNow card's visual language (marker dot, uppercase header, time
 * range) so sessions read the same everywhere.
 */
export default function CompanySessions({
  companyId,
  companyName,
  highlightId,
}: CompanySessionsProps) {
  const selectWalkInRoom = useMapStore((s) => s.selectWalkInRoom);

  const rows = useMemo<SessionRow[]>(() => {
    if (!companyId && !companyName) return [];
    const walkInLabel = getTrack('walk-in-interview')?.label ?? 'Walk-in Interview';
    const out: SessionRow[] = [];

    for (const booking of getWalkInSessionsByCompany(companyId, companyName)) {
      out.push({
        id: booking.id,
        label: walkInLabel,
        title: booking.companyName,
        place: `${ui.companySessions.roomPrefix} ${booking.room}`,
        dayId: booking.dayId,
        start: booking.start,
        end: booking.end,
        highlight: booking.id === highlightId,
        walkIn: { room: booking.room, dayId: booking.dayId },
      });
    }
    for (const session of getSessionsByCompany(companyId ?? '')) {
      out.push({
        id: session.id,
        label: getTrack(session.trackId)?.label ?? session.title,
        title: session.title,
        place: getArea(event.defaultVenueId, session.areaId)?.name ?? '',
        dayId: session.dayId,
        start: session.start,
        end: session.end,
        highlight: false,
      });
    }
    for (const stage of getStageSessionsByCompany(companyId ?? '')) {
      const speaker = stage.speakers[0]?.name;
      out.push({
        id: stage.id,
        label: ui.companySessions.stageLabel,
        title: stage.title,
        place: speaker
          ? `${speaker}${stage.speakers.length > 1 ? ` +${stage.speakers.length - 1}` : ''}`
          : '',
        dayId: stage.dayId,
        start: stage.start,
        end: stage.end,
        highlight: false,
      });
    }

    const dayIndex = new Map(event.days.map((d, i) => [d.id, i]));
    out.sort(
      (a, b) =>
        (dayIndex.get(a.dayId) ?? 0) - (dayIndex.get(b.dayId) ?? 0) ||
        a.start.localeCompare(b.start),
    );
    return out;
  }, [companyId, companyName, highlightId]);

  if (rows.length === 0) {
    return (
      <div className="border-t border-line p-3">
        <div className="section-label mb-2">{ui.companySessions.title}</div>
        <EmptyState
          variant="inline"
          title={ui.companySessions.emptyTitle}
          description={ui.companySessions.emptyBody}
          className="border-0 bg-transparent p-0"
        />
      </div>
    );
  }

  return (
    <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="section-label">{ui.companySessions.title}</div>
        <span className="font-heading text-[11px] font-semibold text-ink-dim">
          {rows.length}
        </span>
      </div>

      <div className="divide-y divide-[#232326]">
        {rows.map((row) => {
          const onSelect = row.walkIn
            ? () => selectWalkInRoom(row.walkIn!.room, row.walkIn!.dayId)
            : undefined;
          const className = `relative block w-full py-2 text-left ${
            row.highlight ? 'bg-[#181818]' : ''
          }`;
          const inner = (
            <>
              {/* IA: date top-right, then hour + place on the meta line —
                  every row answers when it is, what time, and which bilik
                  it currently resides in. */}
              <div className="flex items-center justify-between font-heading text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-dim">
                <span className="flex min-w-0 items-center">
                  <i className="mr-[7px] h-2.5 w-2.5 shrink-0 bg-[var(--accent-pink)]" />
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="shrink-0">{dayLabel(row.dayId)}</span>
              </div>
              <div className="mt-1 truncate text-[13px] font-medium leading-snug text-white">
                {row.title}
              </div>
              <div className="mt-0.5 truncate text-[11px] leading-snug text-ink-dim">
                <span className="tabular-nums">
                  {formatTime(row.start)} - {formatTime(row.end)} WIB
                </span>
                {row.place && <span> · {row.place}</span>}
              </div>
            </>
          );
          return row.walkIn ? (
            <button key={row.id} type="button" onClick={onSelect} className={className}>
              {inner}
            </button>
          ) : (
            <div key={row.id} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
