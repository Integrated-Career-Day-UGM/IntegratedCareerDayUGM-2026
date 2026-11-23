import { getBooth, getCompanyForBooth, getZonesByArea } from '@/lib/data';

interface MapTooltipProps {
  boothId: string;
  x: number;
  y: number;
}

export default function MapTooltip({ boothId, x, y }: MapTooltipProps) {
  const booth = getBooth(boothId);
  const company = getCompanyForBooth(boothId);
  const zone = getZonesByArea(booth?.areaId ?? '').find((z) => z.id === booth?.zoneId);

  return (
    <div
      className="map-tooltip pointer-events-none fixed z-50 min-w-[140px] max-w-[240px] rounded-md border border-zinc-700 bg-[#1c1c20] px-3 py-2 shadow-xl"
      style={{
        left: x,
        top: y,
        borderRightWidth: '3px',
        borderRightColor: zone?.color ?? 'var(--accent-pink)',
      }}
    >
      <div className="text-sm font-bold leading-tight text-white">
        {company?.name ?? booth?.label}
      </div>
      <div
        className="mt-0.5 text-xs font-medium"
        style={{ color: zone?.color ?? 'var(--accent-pink)' }}
      >
        {booth?.code}
      </div>
      {/* Arrow */}
      <div
        className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-zinc-700 bg-[#1c1c20]"
        style={{
          borderRightColor: zone?.color ?? 'var(--accent-pink)',
        }}
      />
    </div>
  );
}
