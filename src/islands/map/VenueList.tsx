import { memo, useCallback, useMemo, useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { track } from '../../lib/analytics';
import EmptyState from '../../components/map/EmptyState';
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import {
  booths,
  companies,
  event,
  getBoothsByArea,
  getCompany,
  getCompanyForBooth,
  getZonesByArea,
  getZone,
  sessions,
  ui,
} from '../../lib/data';
import { formatTime } from '../../lib/map/happening-carousel';

/** "zone-c" → "C" for the ZONE X header, like the reference list. */
const zoneCode = (id: string) => id.replace(/^zone-/, '').toUpperCase();

type SearchKind = 'all' | 'company' | 'opening' | 'session';

const SEARCH_KINDS: { id: SearchKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'opening', label: 'Openings' },
  { id: 'company', label: 'Company' },
  { id: 'session', label: 'Session' },
];

// Selected row style ONLY — the gliding hover highlight (§0) replaces the
// per-row hover bg + bar. Pink inset bar = static selected language (§8).
const rowState = (selected: boolean) =>
  selected ? 'bg-[#181818] shadow-[inset_3px_0_0_var(--accent-pink)]' : '';

/**
 * Memoised rows: hover and unrelated store updates no longer re-render every
 * row in a 120-opening list. Handlers are stable (useCallback) and rows pass
 * ids, not per-row closures.
 */
const BoothRow = memo(function BoothRow({
  boothId,
  boothCode,
  name,
  selected,
  onSelect,
  bookmarked,
  onToggleBookmark,
  bookmarkLabel,
  index,
  registerItem,
  onRowFocus,
  zoneColor,
}: {
  boothId: string;
  boothCode: string;
  name: string;
  selected: boolean;
  onSelect: (boothId: string) => void;
  bookmarked?: boolean;
  onToggleBookmark?: (boothId: string) => void;
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
        onClick={() => onSelect(boothId)}
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
          onClick={() => onToggleBookmark(boothId)}
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
});

/** Flat result row for openings and sessions: code block + title + meta. */
const ResultRow = memo(function ResultRow({
  id,
  code,
  title,
  meta,
  onSelect,
}: {
  id: string;
  code: string;
  title: string;
  meta: string;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#181818]"
    >
      <span className="max-w-[76px] shrink-0 truncate bg-white px-1 py-0.5 font-heading text-[0.6875rem] font-bold uppercase leading-tight tracking-[0.02em] text-black md:text-[10px]">
        {code}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-semibold leading-snug text-white md:text-[13px]">
          {title}
        </span>
        <span className="block truncate text-[0.75rem] leading-snug text-[#8f8f8f] md:text-[11px]">
          {meta}
        </span>
      </span>
    </button>
  );
});

export default function VenueList() {
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const selectFacility = useMapStore((s) => s.selectFacility);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const sidebarTab = useMapStore((s) => s.sidebarTab);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const searchFilters = useMapStore((s) => s.searchFilters);
  const searchKind = useMapStore((s) => s.searchKind);
  const setSearchKind = useMapStore((s) => s.setSearchKind);
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

  const handleSelectBooth = useCallback(
    (boothId: string) => {
      track('item.click', {
        boothId,
        context: useMapStore.getState().searchQuery ? 'search' : 'venue-list',
      });
      selectBooth(boothId);
    },
    [selectBooth],
  );
  const handleToggleBookmark = useCallback(
    (boothId: string) => toggleBookmark(boothId),
    [toggleBookmark],
  );
  const handleOpenCompany = useCallback(
    (companyId: string) => {
      const booth = booths.find((b) => b.companyId === companyId);
      if (booth) selectBooth(booth.id);
    },
    [selectBooth],
  );
  const handleOpenSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;
      if (session.trackId === 'stage') {
        selectFacility('panggung');
        return;
      }
      const booth = booths.find((b) => b.companyId === session.companyId);
      if (booth) selectBooth(booth.id);
    },
    [selectBooth, selectFacility],
  );

  const allBooths = useMemo(
    () => getBoothsByArea(selectedAreaId),
    [selectedAreaId],
  );
  const zones = useMemo(() => getZonesByArea(selectedAreaId), [selectedAreaId]);

  // Zone groups with flat row indices for the hover registry — computed
  // without render-time mutation so React 19 double-renders stay correct.
  const zoneGroups = useMemo(() => {
    const groups: {
      zone: (typeof zones)[number];
      booths: typeof allBooths;
      startIndex: number;
    }[] = [];
    let acc = 0;
    for (const zone of zones) {
      const zoneBooths = allBooths.filter((b) => b.zoneId === zone.id);
      if (zoneBooths.length > 0) {
        groups.push({ zone, booths: zoneBooths, startIndex: acc });
        acc += zoneBooths.length;
      }
    }
    return groups;
  }, [zones, allBooths]);

  const searchTab = sidebarTab === 'search';
  const kind: SearchKind = searchTab ? searchKind : 'company';
  const q = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  const hasFilters =
    searchFilters.tags.length > 0 || searchFilters.types.length > 0;
  const filtering = searchTab ? q.length > 0 || hasFilters || kind !== 'all' : q.length > 0 || hasFilters;

  const filteredBooths = useMemo(() => {
    if (!q && !hasFilters) return allBooths;
    return allBooths.filter((booth) => {
      const company = getCompanyForBooth(booth.id);
      const matchesCode = !q || booth.code.toLowerCase().includes(q);
      const matchesQuery =
        !q ||
        (company?.name.toLowerCase().includes(q) ?? false) ||
        (company?.shortName.toLowerCase().includes(q) ?? false) ||
        (company?.tags.some((t) => t.toLowerCase().includes(q)) ?? false);
      const matchesTags =
        searchFilters.tags.length === 0 ||
        (company?.tags.some((t) => searchFilters.tags.includes(t)) ?? false);
      const matchesTypes =
        searchFilters.types.length === 0 ||
        (company?.openings.some((o) => searchFilters.types.includes(o.type)) ?? false);
      return matchesCode && matchesQuery && matchesTags && matchesTypes;
    });
  }, [allBooths, q, hasFilters, searchFilters]);

  const openingResults = useMemo(() => {
    if (kind === 'company') return [];
    return companies.flatMap((company) =>
      company.openings
        .filter((opening) => {
          const matchesQuery =
            !q ||
            opening.title.toLowerCase().includes(q) ||
            opening.type.toLowerCase().includes(q) ||
            company.name.toLowerCase().includes(q);
          const matchesType =
            searchFilters.types.length === 0 ||
            searchFilters.types.includes(opening.type);
          const matchesTags =
            searchFilters.tags.length === 0 ||
            company.tags.some((t) => searchFilters.tags.includes(t));
          return matchesQuery && matchesType && matchesTags;
        })
        .map((opening) => ({ opening, company })),
    );
  }, [kind, q, searchFilters]);

  const sessionResults = useMemo(() => {
    if (kind === 'company') return [];
    if (!q) return sessions;
    return sessions.filter((session) => {
      const company = getCompany(session.companyId);
      return (
        session.title.toLowerCase().includes(q) ||
        (company?.name.toLowerCase().includes(q) ?? false) ||
        (session.companyName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [kind, q]);

  const dayLabel = useCallback(
    (dayId: string) => event.days.find((day) => day.id === dayId)?.label ?? dayId,
    [],
  );

  const totalResults =
    kind === 'company'
      ? filteredBooths.length
      : kind === 'opening'
        ? openingResults.length
        : kind === 'session'
          ? sessionResults.length
          : filteredBooths.length + openingResults.length + sessionResults.length;

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    clearSearchFilters();
    setSearchKind('all');
  }, [setSearchQuery, clearSearchFilters, setSearchKind]);

  const quickFilters = searchTab ? (
    <div
      className="mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {SEARCH_KINDS.map((item) => {
        const active = item.id === kind;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSearchKind(item.id)}
            aria-pressed={active}
            className={`inline-flex min-h-9 shrink-0 items-center px-3 font-heading text-[0.6875rem] font-bold uppercase tracking-[0.04em] transition-colors active:scale-[0.98] ${
              active
                ? 'bg-white text-black'
                : 'border border-line bg-[#141416] text-white hover:border-[var(--accent-pink)]'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  ) : null;

  // Default directory (Home tab, or Search tab with no query and no type).
  if (!filtering) {
    return (
      <div ref={listRef} className="relative" {...hover.handlers}>
        <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
        {quickFilters}
        {/* Section header with booth count, like the reference list */}
        <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
          <span>{ui.venueList.title}</span>
          <span>{allBooths.length} booths</span>
        </div>

        {zoneGroups.map(({ zone, booths: zoneBooths, startIndex }) => {
          return (
            <div key={zone.id} className="panel-list mb-2.5">
              {/* Zone header: name + count */}
              <div className="section-label flex justify-between border-b border-line px-3 py-2">
                <span>Zone {zoneCode(zone.id)}</span>
                <span>{zoneBooths.length}</span>
              </div>
              <div className="reveal-items divide-y divide-[#2a2a2a]">
                {zoneBooths.map((booth, i) => {
                  const company = getCompanyForBooth(booth.id);
                  return (
                    <BoothRow
                      key={booth.id}
                      boothId={booth.id}
                      index={startIndex + i}
                      registerItem={hover.registerItem}
                      onRowFocus={hover.setActiveIndex}
                      zoneColor={zone.color}
                      boothCode={booth.code}
                      name={company?.name ?? booth.label}
                      selected={selectedBoothId === booth.id}
                      onSelect={handleSelectBooth}
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

  const resetButton = (
    <EmptyState
      title={ui.search.emptyTitle}
      description={ui.search.emptyBody}
      action={{ label: ui.search.emptyAction, onClick: resetSearch }}
    />
  );

  // Company-only results keep the fluid hover list.
  if (kind === 'company') {
    return (
      <div ref={listRef} className="relative" {...hover.handlers}>
        <FluidHoverHighlight hover={hover} className="bg-[#181818]" />
        {quickFilters}
        <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
          <span>
            {ui.search.resultsLabel
              .replace('{count}', String(totalResults))
              .replace('{plural}', totalResults === 1 ? '' : 's')}
          </span>
        </div>
        {totalResults === 0 ? (
          resetButton
        ) : (
          <div className="panel-list reveal-items divide-y divide-[#2a2a2a]">
            {filteredBooths.map((booth, i) => {
              const company = getCompanyForBooth(booth.id);
              return (
                <BoothRow
                  key={booth.id}
                  boothId={booth.id}
                  index={i}
                  registerItem={hover.registerItem}
                  onRowFocus={hover.setActiveIndex}
                  zoneColor={getZone(booth.zoneId)?.color}
                  boothCode={booth.code}
                  name={company?.name ?? booth.label}
                  selected={selectedBoothId === booth.id}
                  onSelect={handleSelectBooth}
                  bookmarked={bookmarkedIds.includes(booth.id)}
                  onToggleBookmark={handleToggleBookmark}
                  bookmarkLabel={ui.boothDetail.bookmarkLabel}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Openings / sessions / mixed results.
  return (
    <div ref={listRef} className="relative">
      {quickFilters}
      <div className="section-label mb-2.5 flex justify-between border-b border-[#232326] pb-2">
        <span>
          {ui.search.resultsLabel
            .replace('{count}', String(totalResults))
            .replace('{plural}', totalResults === 1 ? '' : 's')}
        </span>
      </div>
      {totalResults === 0 ? (
        resetButton
      ) : (
        <div className="space-y-3">
          {kind !== 'opening' && kind !== 'session' && filteredBooths.length > 0 && (
            <div className="panel-list">
              <div className="section-label flex justify-between border-b border-line px-3 py-2">
                <span>Companies</span>
                <span>{filteredBooths.length}</span>
              </div>
              <div className="divide-y divide-[#2a2a2a]">
                {filteredBooths.map((booth) => {
                  const company = getCompanyForBooth(booth.id);
                  return (
                    <ResultRow
                      key={booth.id}
                      id={booth.id}
                      code={booth.code}
                      title={company?.name ?? booth.label}
                      meta="Company booth"
                      onSelect={handleSelectBooth}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {(kind === 'all' || kind === 'opening') && openingResults.length > 0 && (
            <div className="panel-list">
              <div className="section-label flex justify-between border-b border-line px-3 py-2">
                <span>Openings</span>
                <span>{openingResults.length}</span>
              </div>
              <div className="divide-y divide-[#2a2a2a]">
                {openingResults.map(({ opening, company }) => (
                  <ResultRow
                    key={opening.id}
                    id={company.id}
                    code={opening.type || 'Role'}
                    title={opening.title}
                    meta={`${company.name}${opening.location ? ` · ${opening.location}` : ''}`}
                    onSelect={handleOpenCompany}
                  />
                ))}
              </div>
            </div>
          )}

          {(kind === 'all' || kind === 'session') && sessionResults.length > 0 && (
            <div className="panel-list">
              <div className="section-label flex justify-between border-b border-line px-3 py-2">
                <span>Sessions</span>
                <span>{sessionResults.length}</span>
              </div>
              <div className="divide-y divide-[#2a2a2a]">
                {sessionResults.map((session) => {
                  const company = getCompany(session.companyId);
                  const name = company?.name ?? session.companyName ?? '';
                  return (
                    <ResultRow
                      key={session.id}
                      id={session.id}
                      code={formatTime(session.start)}
                      title={session.title}
                      meta={`${dayLabel(session.dayId)} · ${name}`}
                      onSelect={handleOpenSession}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
