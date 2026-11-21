import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import {
  sessions,
  getCompany,
  getArea,
  getBoothsByArea,
  getTodayDayId,
  event,
  ui,
} from '../lib/data';
import { useMapStore } from '../stores/mapStore';

/** Minutes since midnight in the event timezone (WIB). */
function nowMinutes(): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
    const [h, m] = parts.split(':').map(Number);
    return h * 60 + m;
  } catch {
    return 0;
  }
}

/** "13.00" (dotted, like the design) from an ISO timestamp, in WIB. */
function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(iso))
      .replace(':', '.');
  } catch {
    return iso;
  }
}

/** "1 h 20 min" / "45 min" from a minute count. */
function formatDuration(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} h ${m > 0 ? `${m} min` : ''}`.trim();
  }
  return `${mins} min`;
}

/** Minutes since midnight in the event timezone, from an ISO timestamp. */
const minuteOf = (iso: string): number => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
    const [h, m] = parts.split(':').map(Number);
    return h * 60 + m;
  } catch {
    return 0;
  }
};

export default function HappeningNow() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  const isBookmarked = useMapStore((s) => s.isBookmarked);
  // Tick every 30s so live status / countdown stay honest.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const daySessions = sessions
    .filter((s) => s.dayId === selectedDayId)
    .sort((a, b) => a.start.localeCompare(b.start));
  if (daySessions.length === 0) return null;

  const isToday = selectedDayId === getTodayDayId();
  const minutes = isToday ? nowMinutes() : -1;

  // State machine: live session wins; otherwise the next one to start.
  const liveIdx = daySessions.findIndex(
    (s) => minutes >= minuteOf(s.start) && minutes < minuteOf(s.end),
  );
  const nextIdx = daySessions.findIndex((s) => minutes < minuteOf(s.start));
  const idx = liveIdx >= 0 ? liveIdx : nextIdx >= 0 ? nextIdx : daySessions.length - 1;
  const session = daySessions[idx];
  if (!session) return null;

  const startMin = minuteOf(session.start);
  const endMin = minuteOf(session.end);
  const live = liveIdx === idx;
  const ended = !live && minutes >= endMin;

  const label = live
    ? ui.happeningNow.badge
    : ended
      ? ui.happeningNow.endedLabel
      : ui.happeningNow.nextLabel;
  const progress = live ? ((minutes - startMin) / (endMin - startMin)) * 100 : ended ? 100 : 0;
  const countdown = live
    ? `Ends in ${formatDuration(endMin - minutes)}`
    : ended
      ? 'Finished'
      : isToday
        ? `Starts in ${formatDuration(startMin - minutes)}`
        : '';

  const company = getCompany(session.companyId);
  const area = getArea(event.defaultVenueId, session.areaId);
  // Save targets the company's booth in the session's area (bookmarks are booth-based).
  const booth = getBoothsByArea(session.areaId).find((b) => b.companyId === session.companyId);
  const next = daySessions[idx + 1];
  const nextCompany = next ? getCompany(next.companyId) : null;

  return (
    <section className="relative border border-[#f5b400] bg-[#0e0e0e] px-3 pb-2.5 pt-2 shadow-[4px_4px_0_#ff2d6f]">
      {/* Status chip floats on the top border, like the design */}
      <span
        className={`absolute right-3 top-[-10px] px-3 py-px font-heading text-[12px] font-bold ${
          live ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#ededed]'
        }`}
      >
        {label}
      </span>

      {/* Header row: blinking marker + label | time range */}
      <div className="flex items-center justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
        <span className="flex items-center">
          <i className="blink-dot mr-[7px] h-[7px] w-[7px] shrink-0 bg-[#ff2d6f]" />
          {ui.happeningNow.liveLabel}
        </span>
        <span>
          {formatTime(session.start)} - {formatTime(session.end)} WIB
        </span>
      </div>

      {/* Title block with the icon CTAs on its right, room-row height */}
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-heading text-[17px] font-bold leading-tight tracking-[-0.3px] text-white">
            {session.title}
          </h3>
          <p className="text-[11px] leading-snug text-[#8f8f8f]">{company?.name}</p>
          <div className="mt-1 flex items-baseline justify-between gap-2 text-[11px] font-semibold">
            <span className="truncate text-[#ededed]">{area?.name}</span>
            {countdown && <span className="shrink-0 text-[#f5b400]">{countdown}</span>}
          </div>
        </div>

        {/* Icon CTAs per the Figma spec (#414141): NE arrow = show on map,
            bookmark toggles filled/hollow */}
        <div className="flex shrink-0 items-end gap-[7px]">
          <button
            type="button"
            onClick={() => setSelectedArea(session.areaId)}
            aria-label={ui.happeningNow.showOnMap}
            title={ui.happeningNow.showOnMap}
            className="flex size-[33px] items-center justify-center bg-[#414141] transition-colors hover:bg-[#4d4d4d] active:scale-[0.98]"
          >
            <img
              src="/images/arrow-ne.svg"
              alt=""
              className="h-3 w-3 -translate-x-[3px]"
              draggable={false}
            />
          </button>
          {booth && (
            <button
              type="button"
              onClick={() => toggleBookmark(booth.id)}
              aria-label={isBookmarked(booth.id) ? ui.happeningNow.saved : ui.happeningNow.save}
              title={isBookmarked(booth.id) ? ui.happeningNow.saved : ui.happeningNow.save}
              className="flex size-[33px] items-center justify-center bg-[#414141] transition-colors hover:bg-[#4d4d4d] active:scale-[0.98]"
            >
              <Bookmark
                size={16}
                strokeWidth={2}
                className={isBookmarked(booth.id) ? 'fill-current text-white' : 'fill-none text-white'}
              />
            </button>
          )}
        </div>
      </div>

      {/* Progress — fill only, no track, so it never reads as a divider */}
      <div className="my-1.5 h-[2px]">
        <div
          className="h-full bg-[#ff2d6f] transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Footer: up next, or the end-of-day line */}
      <div className="mt-2 border-t border-[#2a2a2a] pt-1.5 text-[11px] text-[#8f8f8f]">
        {next
          ? `${ui.happeningNow.upNext} ${formatTime(next.start)}  ${next.title}${
              nextCompany ? `, ${nextCompany.name}` : ''
            }`
          : ui.happeningNow.noMoreSessions}
      </div>
    </section>
  );
}
