import { forwardRef, useMemo } from 'react';
import { useMapStore } from '../../stores/mapStore';
import {
  event,
  getBoothByCode,
  getCompany,
  walkInSessions,
} from '../../lib/data';
import type { WalkInSession } from '../../types/map';
import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  WALKIN_2F,
  type WalkIn2FConfig,
} from '../../lib/map/floorplan';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(event.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: event.timezone,
  });

/** Gold accent shared with the tooltip / detail card. */
const ROOM_ACCENT = '#6d6a16';

/**
 * Second-floor walk-in plan, rendered inside the same 818×820 frame warp as
 * the career-expo overlay. Rooms behave exactly like a career-expo booth:
 * click (or keyboard focus) pins the shared MapTooltip above the room and
 * opens the walk-in detail in the sidebar; tapping an open room or the map
 * clears it. Hover shows nothing — selection, not peeking, is the interaction.
 */
const WalkInFloorPlanOverlay = forwardRef<
  HTMLDivElement,
  { config?: WalkIn2FConfig }
>(function WalkInFloorPlanOverlay({ config = WALKIN_2F }, ref) {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectWalkInRoom = useMapStore((s) => s.selectWalkInRoom);

  const bookings = useMemo(() => {
    const map = new Map<string, WalkInSession[]>();
    for (const session of walkInSessions) {
      if (session.dayId !== selectedDayId) continue;
      const list = map.get(session.room);
      if (list) list.push(session);
      else map.set(session.room, [session]);
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [selectedDayId]);

  const day = event.days.find((entry) => entry.id === selectedDayId);
  const dayLabel = day
    ? new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
    : '';

  return (
    <>
      <div
        ref={ref}
        data-floorplan-root=""
        className="pointer-events-none absolute top-0 left-0 select-none"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <div className="absolute left-8 top-5 flex items-center gap-2.5 rounded-sm border border-white/20 bg-[#0c0c0f]/85 px-3 py-1.5 font-heading text-[16px] font-bold leading-none text-white">
          <span>2nd floor</span>
          <span className="text-[#8f8f8f]">·</span>
          <span>{dayLabel}</span>
        </div>

        <div
          className="absolute"
          style={{
            left: config.hull.left,
            top: config.hull.top,
            width: config.hull.w,
            height: config.hull.h,
            transform: `rotate(${config.hull.rotate}deg)`,
            transformOrigin: 'center',
          }}
        >
          <img
            src="/maps/assets/walk-in-2f-hull.svg"
            alt=""
            draggable={false}
            className="absolute inset-0 size-full max-w-none"
          />

          {(config.decor ?? WALKIN_2F.decor ?? []).map((decor) => (
            <img
              key={decor.id}
              src={decor.src}
              alt={decor.label}
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                left: decor.left,
                top: decor.top,
                width: decor.w,
                height: decor.h,
                transform: `rotate(${decor.rotate}deg)`,
                transformOrigin: 'center',
              }}
            />
          ))}

          {config.rooms.map((room) => {
            // A bilik can host several companies across the day's slots —
            // the chip shows the earliest one, with a +N for the rest.
            const roomBookings = bookings.get(room.id) ?? [];
            const booking = roomBookings[0];
            const extra = roomBookings.length - 1;
            const company = booking?.companyId
              ? getCompany(booking.companyId)
              : undefined;
            const baseTitle = company?.shortName ?? booking?.companyName;
            const title = baseTitle
              ? `${baseTitle}${extra > 0 ? ` +${extra}` : ''}`
              : 'Open';
            const time = booking ? formatTime(booking.start) : '';
            const booked = roomBookings.length > 0;
            const booth = booking?.boothRef
              ? getBoothByCode(booking.boothRef)
              : undefined;
            const selected = selectedWalkInRoomId === room.id;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  // Booked room: pin the tooltip + open the detail. Open
                  // room: same as tapping empty map — clear the selection.
                  selectWalkInRoom(booking ? room.id : null);
                }}
                onFocus={booking ? () => selectWalkInRoom(room.id) : undefined}
                aria-pressed={selected}
                aria-label={
                  booking
                    ? `${room.id} ${title}${booth ? `, booth ${booth.code}` : ''}`
                    : `${room.id} open`
                }
                className={`pointer-events-auto absolute flex flex-col items-center justify-center border border-black/30 text-center text-white shadow-sm transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-pink)] ${
                  booked ? 'bg-[#6d6a16]' : 'bg-[#3b3b2a]'
                }`}
                style={{
                  left: config.content.left + room.left * config.content.scale,
                  top: config.content.top + room.top * config.content.scale,
                  width: room.w * config.content.scale,
                  height: room.h * config.content.scale,
                  transform: `rotate(${room.rotate}deg)`,
                  ...(selected ? { zIndex: 10 } : {}),
                }}
              >
                {selected && (
                  <>
                    <span
                      className="venue-ring"
                      style={{
                        borderColor: ROOM_ACCENT,
                        backgroundColor: `${ROOM_ACCENT}22`,
                      }}
                      aria-hidden="true"
                    />
                    <span
                      className="venue-ring"
                      style={{
                        borderColor: ROOM_ACCENT,
                        backgroundColor: `${ROOM_ACCENT}22`,
                        animationDelay: '0.6s',
                      }}
                      aria-hidden="true"
                    />
                  </>
                )}
                <span className="font-heading text-[18px] font-bold leading-none">
                  {room.id}
                </span>
                <span className="mt-0.5 max-w-full truncate px-1 text-[7px] leading-tight opacity-90">
                  {title}
                </span>
                {time && (
                  <span className="text-[7px] leading-tight opacity-70">
                    {time}
                  </span>
                )}
                {booking?.boothRef && (
                  <span className="text-[7px] leading-tight opacity-70">
                    {booking.boothRef}
                  </span>
                )}
              </button>
            );
          })}

          {config.signs.map((sign) => (
            <div
              key={sign.id}
              className={`absolute flex items-center justify-center font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-white ${
                sign.id === 'exit' ? 'bg-[#f21f1f]' : 'bg-[#1fe21f]'
              }`}
              style={{
                left: sign.left,
                top: sign.top,
                width: sign.w,
                height: sign.h,
                transform: `rotate(${sign.rotate}deg)`,
              }}
            >
              {sign.id}
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

WalkInFloorPlanOverlay.displayName = 'WalkInFloorPlanOverlay';

export default WalkInFloorPlanOverlay;
