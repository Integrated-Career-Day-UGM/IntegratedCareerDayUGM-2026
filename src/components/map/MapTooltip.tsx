import {
  getBooth,
  getCompanyForBooth,
  getSessionsByArea,
  getTrack,
  getZonesByArea,
} from '@/lib/data';
import { formatTime } from '@/lib/map/happening-carousel';

interface MapTooltipProps {
  boothId: string;
  x: number;
  y: number;
}

/**
 * Compact company/session bubble with a zone-tinted cover; below it: who,
 * what, when, and where. No skeleton flash and no side accent.
 */
export default function MapTooltip({ boothId, x, y }: MapTooltipProps) {
  const booth = getBooth(boothId);
  const company = getCompanyForBooth(boothId);
  const zone = getZonesByArea(booth?.areaId ?? '').find((z) => z.id === booth?.zoneId);
  const session = booth
    ? getSessionsByArea(booth.areaId).find((s) => s.companyId === booth.companyId)
    : undefined;
  const track = session ? getTrack(session.trackId) : null;

  const title = company?.name ?? session?.title ?? booth?.label ?? '';

  return (
    <div
      className="map-tooltip pointer-events-none fixed z-50 w-[240px] border border-line bg-[#141416] md:w-[280px]"
      style={{ left: x, top: y }}
    >
      {/* Cover strip above the title — zone-tinted, no skeleton flash. */}
      <div
        className="relative h-12 w-full overflow-hidden border-b border-line md:h-14"
        style={{
          background: `linear-gradient(135deg, ${zone?.color ?? '#27272a'}33 0%, #141416 70%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-12">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt=""
              className="max-h-8 w-auto object-contain"
            />
          ) : null}
        </div>
        <span
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: zone?.color ?? '#27272a' }}
        >
          {booth?.code}
        </span>
      </div>

      <div className="px-3 pt-2">
        <div className="truncate text-[14px] font-semibold leading-tight text-white">
          {title}
        </div>
        <div className="truncate text-[12px] leading-tight text-ink-dim">
          {session ? session.title : (track?.label ?? booth?.label)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1.5">
        <span className="text-[12px] tabular-nums text-ink-body">
          {session
            ? `${formatTime(session.start)}–${formatTime(session.end)} WIB`
            : (zone?.name ?? '')}
        </span>
        {track && (
          <span className="shrink-0 bg-[#1f1f23] px-1.5 py-0.5 text-[11px] text-[#d4d4d8]">
            {track.label}
          </span>
        )}
      </div>

      {/* Pointer — a gentle bob so it keeps pointing at the selected venue. */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
        <div className="map-tooltip-pointer h-3 w-3 rotate-45 border-b border-r border-line bg-[#141416]" />
      </div>
    </div>
  );
}
