import { useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { track } from '../lib/analytics';
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from '../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../components/ui/fluid-hover-highlight';
import { getBoothsByArea, getZonesByArea, getCompanyForBooth, getCompany, getZone, ui } from '../lib/data';

/** "zone-c" → "C" for the ZONE X header, like the reference list. */
const zoneCode = (id: string) => id.replace(/^zone-/, '').toUpperCase();

// Selected row style ONLY — the gliding hover highlight (§0) replaces the
// per-row hover bg + bar. Pink inset bar = static selected language (§8).
const rowState = (selected: boolean) =>
  selected ? 'bg-[#181818] shadow-[inset_3px_0_0_var(--accent-pink)]' : '';

function BoothRow({
  boothCode,
  name,
  selected,
  onClick,
  bookmarked,
  onToggleBookmark,
  bookmarkLabel,
  index,
  registerItem,
  onRowFocus,
  zoneColor,
}: {
  boothCode: string;
  name: string;
  selected: boolean;
  onClick: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  bookmarkLabel?: string;
  /** Flat index within the hover container (spans zone groups). */
  index?: number;
  registerItem?: (i: number, el: HTMLElement | null) => void;
  onRowFocus?: (i: number) => void;
  /** Zone color — the code chip is the wayfinding unit linking the row to
      its colored map booth (DESIGN.md; §2/§9). */
  zoneColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} className={`relative flex items-center ${rowState(selected)}`}>
      <button
        type="button"
        onClick={onClick}
        onFocus={() => index !== undefined && onRowFocus?.(index)}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-[7px] text-left text-[13px] font-semibold leading-[1.2]"
      >
        <span
          className="font-heading min-w-[30px] shrink-0 rounded-[2px] px-1 text-center text-[12px] font-bold leading-[1.5] text-white"
          style={{ backgroundColor: zoneColor ?? 'var(--color-chip)' }}
        >
          {boothCode}
        </span>
        <span className="truncate text-ink-body">{name}</span>
      </button>
      {onToggleBookmark && (
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`shrink-0 p-2 transition-[transform,colors] active:scale-95 ${
            bookmarked ? 'text-[var(--accent-pink)]' : 'text-ink-dim hover:text-white'
          }`}
          aria-label={bookmarkLabel}
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

export default function VenueList() {
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  // The array itself, not the isBookmarked() helper: without it the row
  // icons render once and never flip when toggled.
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);

  // One gliding highlight across the whole list region (§0). The container
  // ref attaches to whichever branch renders (search results or zones).
  const listRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(listRef);

  const handleSelectBooth = (boothId: string) => {
    track('item.click', { boothId, context: searchQuery ? 'search' : 'venue-list' });
    selectBooth(boothId);
  };
  const zones = getZonesByArea(selectedAreaId);
  const allBooths = getBoothsByArea(selectedAreaId);

  // Zone groups with flat row indices for the hover registry — computed
  // without render-time mutation so React 19 double-renders stay correct.
  const zoneGroups: { zone: (typeof zones)[number]; booths: typeof allBooths; startIndex: number }[] =
    [];
  let acc = 0;
  for (const zone of zones) {
    const booths = allBooths.filter((b) => b.zoneId === zone.id);
    if (booths.length > 0) {
      zoneGroups.push({ zone, booths, startIndex: acc });
      acc += booths.length;
    }
  }

  const filteredBooths = searchQuery
    ? allBooths.filter((b) => {
        const company = getCompanyForBooth(b.id);
        const q = searchQuery.toLowerCase();
        return (
          b.code.toLowerCase().includes(q) ||
          company?.name.toLowerCase().includes(q) ||
          company?.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : null;

  if (filteredBooths) {
    const count = filteredBooths.length;
    return (
      <div ref={listRef} className="relative" {...hover.handlers}>
        <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
        <div className="mb-2.5 flex justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">
          <span>
            {ui.search.resultsLabel.replace('{count}', String(count)).replace('{plural}', count === 1 ? '' : 's')}
          </span>
        </div>
        {count === 0 ? (
          <div className="border border-line bg-cardbg px-3 py-4 text-[13px] text-ink-dim">
            {ui.search.emptyResults}
          </div>
        ) : (
          <div className="border border-line bg-cardbg">
            {filteredBooths.map((booth, i) => {
              const company = getCompanyForBooth(booth.id);
              return (
                <BoothRow
                  key={booth.id}
                  index={i}
                  registerItem={hover.registerItem}
                  onRowFocus={hover.setActiveIndex}
                  zoneColor={getZone(booth.zoneId)?.color}
                  boothCode={booth.code}
                  name={company?.name ?? booth.label}
                  selected={selectedBoothId === booth.id}
                  onClick={() => handleSelectBooth(booth.id)}
                  bookmarked={bookmarkedIds.includes(booth.id)}
                  onToggleBookmark={() => toggleBookmark(booth.id)}
                  bookmarkLabel={ui.boothDetail.bookmarkLabel}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={listRef} className="relative" {...hover.handlers}>
      <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
      {/* Section header with booth count, like the reference list */}
      <div className="mb-2.5 flex justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">
        <span>{ui.venueList.title}</span>
        <span className="text-ink-dim">{allBooths.length} booths</span>
      </div>

      {zoneGroups.map(({ zone, booths, startIndex }) => {
        return (
          <div
            key={zone.id}
            className="mb-2.5 border border-line bg-cardbg"
          >
            {/* Zone header: name + count */}
            <div className="flex justify-between border-b border-line px-3 py-2 font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">
              <span>Zone {zoneCode(zone.id)}</span>
              <span>{booths.length}</span>
            </div>
            <div>
              {booths.map((booth, i) => {
                const company = getCompanyForBooth(booth.id);
                return (
                  <BoothRow
                    key={booth.id}
                    index={startIndex + i}
                    registerItem={hover.registerItem}
                    onRowFocus={hover.setActiveIndex}
                    zoneColor={zone.color}
                    boothCode={booth.code}
                    name={company?.name ?? booth.label}
                    selected={selectedBoothId === booth.id}
                    onClick={() => handleSelectBooth(booth.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
