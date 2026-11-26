import { useMemo, useRef } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { track } from '../../lib/analytics';
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import EmptyState from '../../components/map/EmptyState';
import { event, getCompany, getTrack, ui, walkInSessions } from '../../lib/data';
import { formatTime } from '../../lib/map/happening-carousel';
import type { WalkInSession } from '../../types/map';

/** Gold accent — the same slab colour the 2F room chips use on the map. */
const ROOM_ACCENT = '#6d6a16';

/** "Hari 1 · 28 Nov" — the sheet's day grouping, in the event locale. */
function dayHeading(dayId: string): string {
  const index = event.days.findIndex((d) => d.id === dayId);
  const day = event.days[index];
  if (!day) return dayId;
  const date = new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `Hari ${index + 1} · ${date}`;
}

// Selected row style: same language as VenueList rows.
const rowState = (selected: boolean) =>
  selected ? 'bg-[#181818] shadow-[inset_3px_0_0_var(--accent-pink)]' : '';

function WalkInRow({
  booking,
  selected,
  index,
  registerItem,
  onFocusIndex,
  onClick,
}: {
  booking: WalkInSession;
  selected: boolean;
  index: number;
  registerItem: (i: number, el: HTMLElement | null) => void;
  onFocusIndex: (i: number) => void;
  onClick: (booking: WalkInSession) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  const company = booking.companyId ? getCompany(booking.companyId) : undefined;
  return (
    <div
      ref={ref}
      className={`relative flex items-center border border-transparent transition-colors md:hover:border-[var(--accent-pink)] ${rowState(selected)}`}
    >
      <button
        type="button"
        onClick={() => onClick(booking)}
        onFocus={() => onFocusIndex(index)}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-[0.9375rem] font-semibold leading-[1.25] md:py-2 md:text-[13px]"
        aria-pressed={selected}
      >
        <span
          className="font-heading min-w-[30px] shrink-0 rounded-[2px] px-1 text-center text-[0.8125rem] font-bold leading-[1.5] text-white md:text-[12px]"
          style={{ backgroundColor: ROOM_ACCENT }}
        >
          {booking.room}
        </span>
        <span className="min-w-0 flex-1 truncate text-ink-body">
          {company?.name ?? booking.companyName}
        </span>
        <span className="shrink-0 text-[0.75rem] font-medium tabular-nums text-ink-dim md:text-[11px]">
          {formatTime(booking.start)} - {formatTime(booking.end)}
        </span>
      </button>
    </div>
  );
}

/**
 * Sidebar list for the walk-in tab: every bilik booking from the walk-in
 * sheet (walk-in.yaml), grouped by day — the table the venue list is blind to
 * (Hall B holds no expo booths). Selecting a row pins the room's tooltip and
 * opens its detail, switching to the booking's day when needed.
 */
export default function WalkInList() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectWalkInRoom = useMapStore((s) => s.selectWalkInRoom);
  const searchQuery = useMapStore((s) => s.searchQuery);

  const listRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(listRef);

  const groups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = (booking: WalkInSession) => {
      if (!q) return true;
      const company = booking.companyId ? getCompany(booking.companyId) : undefined;
      return (
        booking.room.toLowerCase().includes(q) ||
        booking.companyName.toLowerCase().includes(q) ||
        (company?.name.toLowerCase().includes(q) ?? false)
      );
    };
    return event.days
      .map((day) => ({
        dayId: day.id,
        label: dayHeading(day.id),
        bookings: walkInSessions
          .filter((b) => b.dayId === day.id && matches(b))
          .sort(
            (a, b) =>
              Number(a.room.replace(/\D+/g, '')) - Number(b.room.replace(/\D+/g, '')) ||
              a.start.localeCompare(b.start),
          ),
      }))
      .filter((group) => group.bookings.length > 0);
  }, [searchQuery]);

  const total = groups.reduce((n, group) => n + group.bookings.length, 0);
  let flatIndex = 0;

  const handleSelect = (booking: WalkInSession) => {
    track('item.click', {
      roomId: booking.room,
      dayId: booking.dayId,
      companyId: booking.companyId,
      context: 'walkin-list',
    });
    selectWalkInRoom(booking.room, booking.dayId);
  };

  return (
    <div ref={listRef} className="relative" {...hover.handlers}>
      <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
      <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
        <span>{getTrack('walk-in-interview')?.label ?? 'Walk-in Interview'}</span>
        <span>{total} bookings</span>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          className="panel-list"
          title={ui.walkInList.emptyTitle}
          description={ui.walkInList.emptyBody}
        />
      ) : (
        groups.map((group) => (
          <div key={group.dayId} className="panel-list mb-2.5">
            <div className="section-label flex justify-between border-b border-line px-3 py-2">
              <span>{group.label}</span>
              <span>{group.bookings.length}</span>
            </div>
            <div className="reveal-items divide-y divide-[#2a2a2a]">
              {group.bookings.map((booking) => {
                const index = flatIndex++;
                return (
                  <WalkInRow
                    key={booking.id}
                    booking={booking}
                    index={index}
                    registerItem={hover.registerItem}
                    onFocusIndex={hover.setActiveIndex}
                    selected={
                      selectedWalkInRoomId === booking.room &&
                      selectedDayId === booking.dayId
                    }
                    onClick={handleSelect}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
