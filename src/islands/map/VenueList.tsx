import { useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { track } from '../../lib/analytics';
import EmptyState from '../../components/map/EmptyState';
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { getBoothsByArea, getZonesByArea, getCompanyForBooth, getZone, ui } from '../../lib/data';

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
    <div
      ref={ref}
      className={`relative flex items-center border border-transparent transition-colors md:hover:border-[var(--accent-pink)] ${rowState(selected)}`}
    >
      <button
        type="button"
        onClick={onClick}
        onFocus={() => index !== undefined && onRowFocus?.(index)}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-[0.9375rem] font-semibold leading-[1.25] md:py-2 md:text-[13px]"
      >
        <span
          className="font-heading min-w-[30px] shrink-0 rounded-[2px] px-1 text-center text-[0.8125rem] font-bold leading-[1.5] text-white md:text-[12px]"
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
          className={`shrink-0 p-3 transition-[transform,colors] active:scale-95 md:p-2 ${
            bookmarked ? 'text-[var(--accent-pink)]' : 'text-ink-dim hover:text-white'
          }`}
          aria-label={bookmarkLabel}
        >
          <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} className="md:h-4 md:w-4" />
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
  const searchFilters = useMapStore((s) => s.searchFilters);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const clearSearchFilters = useMapStore((s) => s.clearSearchFilters);
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

  const hasFilters =
    searchFilters.tags.length > 0 || searchFilters.types.length > 0;
  const filteredBooths =
    searchQuery || hasFilters
      ? allBooths.filter((b) => {
          const company = getCompanyForBooth(b.id);
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            !q ||
            b.code.toLowerCase().includes(q) ||
            company?.name.toLowerCase().includes(q) ||
            company?.tags.some((t) => t.toLowerCase().includes(q));
          const matchesTags =
            searchFilters.tags.length === 0 ||
            (company?.tags.some((t) => searchFilters.tags.includes(t)) ?? false);
          const matchesTypes =
            searchFilters.types.length === 0 ||
            (company?.openings.some((o) => searchFilters.types.includes(o.type)) ?? false);
          return matchesQuery && matchesTags && matchesTypes;
        })
      : null;

  if (filteredBooths) {
    const count = filteredBooths.length;
    return (
      <div ref={listRef} className="relative" {...hover.handlers}>
        <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
        <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
          <span>
            {ui.search.resultsLabel.replace('{count}', String(count)).replace('{plural}', count === 1 ? '' : 's')}
          </span>
        </div>
        {count === 0 ? (
          <EmptyState
            className="panel-list"
            title={ui.search.emptyTitle}
            description={ui.search.emptyBody}
            action={{
              label: ui.search.emptyAction,
              onClick: () => {
                setSearchQuery('');
                clearSearchFilters();
              },
            }}
          />
        ) : (
          <div className="panel-list reveal-items divide-y divide-[#2a2a2a]">
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
      <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
        <span>{ui.venueList.title}</span>
        <span>{allBooths.length} booths</span>
      </div>

      {zoneGroups.map(({ zone, booths, startIndex }) => {
        return (
          <div
            key={zone.id}
            className="panel-list mb-2.5"
          >
            {/* Zone header: name + count */}
            <div className="section-label flex justify-between border-b border-line px-3 py-2">
              <span>Zone {zoneCode(zone.id)}</span>
              <span>{booths.length}</span>
            </div>
            <div className="reveal-items divide-y divide-[#2a2a2a]">
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
