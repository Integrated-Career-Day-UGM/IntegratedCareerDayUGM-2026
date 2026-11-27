import { useRef } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { track } from '../../lib/analytics';
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import EmptyState from '../../components/map/EmptyState';
import {
  booths,
  event,
  getArea,
  getCompany,
  getSessionsByArea,
} from '../../lib/data';
import { formatTime } from '../../lib/map/happening-carousel';
import type { Session } from '../../types/map';

/** "Hari 1 · 28 Nov" — same day grouping as the walk-in list. */
function dayHeading(dayId: string): string {
  const index = event.days.findIndex((day) => day.id === dayId);
  const day = event.days[index];
  if (!day) return dayId;
  const date = new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `Hari ${index + 1} · ${date}`;
}

function CounselingRow({
  session,
  index,
  registerItem,
  onFocusIndex,
}: {
  session: Session;
  index: number;
  registerItem: (i: number, el: HTMLElement | null) => void;
  onFocusIndex: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const company = getCompany(session.companyId);
  const booth = booths.find((item) => item.companyId === session.companyId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!booth) return;
          track('item.click', {
            boothId: booth.id,
            context: 'counseling-list',
          });
          selectBooth(booth.id);
        }}
        onFocus={() => onFocusIndex(index)}
        disabled={!booth}
        className="flex w-full items-center gap-3 border border-transparent px-3 py-3 text-left transition-colors hover:bg-[#181818] disabled:cursor-default md:py-2.5 md:hover:border-[var(--accent-pink)]"
      >
        <span className="w-[82px] shrink-0 text-[0.8125rem] font-semibold tabular-nums text-white md:text-[12px]">
          {formatTime(session.start)}–{formatTime(session.end)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-semibold leading-snug text-white md:text-[13px]">
            {company?.name ?? session.title}
          </span>
          <span className="mt-0.5 block text-[0.75rem] text-ink-dim md:text-[11px]">
            {getArea(event.defaultVenueId, session.areaId)?.name ?? session.title}
          </span>
        </span>
        {booth && (
          <span
            className="shrink-0 rounded-[2px] px-1.5 py-0.5 font-heading text-[0.75rem] font-bold text-white md:text-[11px]"
            style={{ backgroundColor: 'var(--color-chip)' }}
          >
            {booth.code}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Counseling track list: sessions grouped by day at PP KAGAMA. There is no
 * booth grid for this venue, so the list itself is the way in. Clicking a
 * session opens the participating company's expo booth detail.
 */
export default function CounselingList() {
  const hoveredRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(hoveredRef);
  const sessions = getSessionsByArea('pp-kagama');
  const groups = event.days
    .map((day) => ({
      day,
      rows: sessions.filter((session) => session.dayId === day.id),
    }))
    .filter((group) => group.rows.length > 0);

  let index = 0;

  return (
    <div ref={hoveredRef} className="relative" {...hover.handlers}>
      <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
      <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
        <span>Counseling · Booth B</span>
        <span>{sessions.length} sessions</span>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal counseling"
          description="Jadwal counseling akan tampil di sini."
        />
      ) : (
        groups.map(({ day, rows }) => (
          <div key={day.id} className="panel-list mb-2.5">
            <div className="section-label border-b border-line px-3 py-2">
              {dayHeading(day.id)}
            </div>
            {rows.map((session) => {
              const current = index++;
              return (
                <CounselingRow
                  key={session.id}
                  session={session}
                  index={current}
                  registerItem={hover.registerItem}
                  onFocusIndex={hover.setActiveIndex}
                />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
