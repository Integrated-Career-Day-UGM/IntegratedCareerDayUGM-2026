import {
  getBooth,
  getCompany,
  getCompanyForBooth,
  getZonesByArea,
} from '@/lib/data';

/** Optional walk-in context so the same bubble can describe a 2F room. */
export interface MapTooltipWalkIn {
  room: string;
  companyId: string | null;
  companyName: string;
}

interface MapTooltipProps {
  boothId?: string;
  walkIn?: MapTooltipWalkIn;
  x: number;
  y: number;
}

/**
 * Compact company bubble: code, name, short description, then an openings
 * count when there is one. No repeated booth code and no session chrome.
 * Shared by the career-expo booths and the walk-in 2F rooms.
 */
export default function MapTooltip({ boothId, walkIn, x, y }: MapTooltipProps) {
  const booth = boothId ? getBooth(boothId) : undefined;
  const company =
    (walkIn?.companyId ? getCompany(walkIn.companyId) : undefined) ??
    (boothId ? getCompanyForBooth(boothId) : undefined);
  const zone = getZonesByArea(booth?.areaId ?? '').find((z) => z.id === booth?.zoneId);
  const title = walkIn
    ? company?.shortName ?? walkIn.companyName
    : company?.name ?? booth?.label ?? '';
  const code = walkIn?.room ?? booth?.code;
  const openings = company?.openings.length ?? 0;

  return (
    <div
      className="map-tooltip pointer-events-none fixed z-50 w-[266px] border border-line bg-[#141416] md:w-[280px]"
      style={{ left: x, top: y }}
    >
      <div
        className="relative min-h-[53px] w-full overflow-hidden border-b border-line md:h-14"
        style={{
          background: `linear-gradient(135deg, ${zone?.color ?? (walkIn ? '#6d6a16' : '#27272a')}33 0%, #141416 70%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-12">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt=""
              className="max-h-8 w-auto object-contain max-md:max-h-[36px]"
            />
          ) : null}
        </div>
        <span
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-white md:text-[0.625rem]"
          style={{ backgroundColor: zone?.color ?? (walkIn ? '#6d6a16' : '#27272a') }}
        >
          {code}
        </span>
      </div>

      <div className="px-[13px] py-[9px] md:px-3 md:py-2">
        <div className="truncate text-[0.96875rem] font-semibold leading-tight text-white md:text-[0.875rem]">
          {title}
        </div>
        {company?.description && (
          <p className="mt-1 line-clamp-3 text-[0.71875rem] leading-snug text-[#a1a1aa] md:text-[0.75rem]">
            {company.description}
          </p>
        )}
        {openings > 0 && (
          <div className="mt-1.5 text-[0.71875rem] text-[#8f8f8f] md:text-[0.75rem]">
            {openings} opening{openings === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
        <div className="map-tooltip-pointer h-3 w-3 rotate-45 border-b border-r border-line bg-[#141416]" />
      </div>
    </div>
  );
}
