import { useRef, useState, useCallback, useEffect } from 'react';
import { Home, Search, Bookmark, BarChart3, Info } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { ScrollArea } from '../../components/ui/scroll-area';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import WalkInList from './WalkInList';
import CounselingList from './CounselingList';
import BoothDetail from './BoothDetail';
import WalkInDetail from './WalkInDetail';
import FacilityDetail from './FacilityDetail';
import TraySkeleton from '../../components/map/TraySkeleton';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import { ui } from '../../lib/data';


export const SNAP_PEEK = 110;
/** Opening height for the tray — search and venue detail both start here. */
const DETAIL_RATIO = 0.4;
const DETAIL_MAX_RATIO = 0.5;
const getDetailHeight = () =>
  Math.max(240, Math.round(window.innerHeight * DETAIL_RATIO));
const getDetailMaxHeight = () =>
  Math.max(240, Math.round(window.innerHeight * DETAIL_MAX_RATIO));
const SNAP_FULL_RATIO = 0.94;
/** Room kept above the fully-raised sheet. The live chrome bottom is read
 *  from `#map-chrome`, so the tray maxes out just under QuickFind. */
const TOP_CLEAR = 24;
/** Tab rail height (h-14). Exported with SNAP_PEEK so map chrome can sit
    above the tray's peek state without hard-coding its height (§1). */
export const TAB_RAIL_H = 66;

const mobileTabs: { id: 'home' | 'search' | 'saved' | 'stats' | 'info'; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'search', icon: Search },
  { id: 'saved', icon: Bookmark },
  { id: 'stats', icon: BarChart3 },
  { id: 'info', icon: Info },
];

export default function MobileBottomSheet() {
  const sidebarMode = useMapStore((s) => s.sidebarMode);
  const sidebarTab = useMapStore((s) => s.sidebarTab);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectedFacilityId = useMapStore((s) => s.selectedFacilityId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectedTrackId = useMapStore((s) => s.selectedTrackId);
  const walkInMode =
    selectedTrackId === 'walk-in-interview' || selectedAreaId === 'hall-b';
  const counselingMode =
    selectedTrackId === 'career-counseling' || selectedAreaId === 'pp-kagama';
  // Gliding hover highlight across the tab rail (§0).
  const railRef = useRef<HTMLElement>(null);
  const hover = useFluidHover(railRef, { axis: 'x' });
  const [height, setHeight] = useState<number>(() =>
    typeof window === 'undefined' ? SNAP_PEEK : getDetailHeight(),
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const detailKey = selectedBoothId ?? selectedWalkInRoomId ?? selectedFacilityId ?? '';
  const [detailLoading, setDetailLoading] = useState(false);
  const previousDetailKeyRef = useRef('');
  const [showDragHint, setShowDragHint] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem('icd:tray-drag-hint') === '1') return;
      let timer = 0;
      const reveal = () => {
        setShowDragHint(true);
        timer = window.setTimeout(() => {
          setShowDragHint(false);
          window.localStorage.setItem('icd:tray-drag-hint', '1');
        }, 5000);
      };
      const readyWindow = window as unknown as { __icdMapReady?: boolean };
      if (readyWindow.__icdMapReady) reveal();
      else window.addEventListener('icd:map-ready', reveal, { once: true });
      return () => {
        window.removeEventListener('icd:map-ready', reveal);
        if (timer) window.clearTimeout(timer);
      };
    } catch {
      // Private mode: skip the one-time hint.
      return;
    }
  }, []);
  useEffect(() => {
    if (!['detail', 'facility'].includes(sidebarMode) || !detailKey) {
      previousDetailKeyRef.current = '';
      setDetailLoading(false);
      return;
    }
    if (previousDetailKeyRef.current === detailKey) return;
    previousDetailKeyRef.current = detailKey;
    setDetailLoading(true);
    const timer = window.setTimeout(() => setDetailLoading(false), 200);
    return () => window.clearTimeout(timer);
  }, [sidebarMode, detailKey]);

  const getMaxHeight = () => {
    const state = useMapStore.getState();
    // Detail/facility can be pulled to half the viewport; search is capped
    // at its opening height. Other tabs keep the full sheet.
    if (['detail', 'facility'].includes(state.sidebarMode)) return getDetailMaxHeight();
    if (state.sidebarTab === 'search') return getDetailHeight();
    const chrome = document.getElementById('map-chrome');
    const chromeBottom = chrome
      ? chrome.getBoundingClientRect().bottom
      : TOP_CLEAR;
    const topClear = Math.max(TOP_CLEAR, chromeBottom + 8);
    // The tab rail sits below the sheet, so subtract it from the viewport
    // budget before capping the sheet.
    return Math.min(
      window.innerHeight - topClear - TAB_RAIL_H,
      window.innerHeight * SNAP_FULL_RATIO,
    );
  };

  const snapTo = useCallback((target: number) => {
    const max = getMaxHeight();
    setHeight(Math.max(SNAP_PEEK, Math.min(max, target)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setShowDragHint(false);
    try {
      window.localStorage.setItem('icd:tray-drag-hint', '1');
    } catch {
      // Private mode.
    }
    dragStartY.current = e.clientY;
    startHeight.current = height;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = dragStartY.current - e.clientY;
    const raw = startHeight.current + delta;
    const max = getMaxHeight();
    // Android-style rubber band: past the cap the tray still follows the
    // finger, but with heavy resistance, then springs back on release.
    const resisted =
      raw > max ? max + Math.min(28, (raw - max) * 0.18) : raw;
    setHeight(Math.max(SNAP_PEEK, resisted));
  };

  const onPointerUp = () => {
    setIsDragging(false);
    const half = getDetailHeight();
    const max = getMaxHeight();
    // Read the rendered height: React state can be one frame behind the last
    // pointermove, and the rubber-band snap must use the real position.
    const currentHeight = sheetRef.current?.getBoundingClientRect().height ?? height;
    if (currentHeight > max) {
      snapTo(max);
      return;
    }
    const midPeekHalf = (SNAP_PEEK + half) / 2;
    const midHalfFull = (half + max) / 2;

    if (currentHeight < midPeekHalf) snapTo(SNAP_PEEK);
    else if (currentHeight < midHalfFull) snapTo(half);
    else snapTo(max);
  };

  /** Touching the list at peek raises the tray enough for a real scroll. */
  const raiseFromPeek = () => {
    const mode = useMapStore.getState().sidebarMode;
    if (['detail', 'facility'].includes(mode)) return;
    if (height <= SNAP_PEEK + 1) snapTo(getDetailHeight());
  };

  const setTab = (tab: typeof sidebarTab) => {
    setSidebarTab(tab);
    // Search is a working state like venue detail: give the list the 30%
    // tray height instead of leaving it at peek.
    if (tab === 'search') snapTo(getDetailHeight());
    if (tab === 'search') window.dispatchEvent(new CustomEvent('icd:focus-search'));
  };

  useEffect(() => {
    const raiseForSearch = () => snapTo(getDetailHeight());
    window.addEventListener('icd:focus-search', raiseForSearch);
    return () => window.removeEventListener('icd:focus-search', raiseForSearch);
  }, [snapTo]);

  // Raise the sheet when the content context changes — a tab switch (the
  // top search bar focuses 'search' too) or a booth detail opening — but
  // ONLY on the transition itself. An unconditional effect would re-fire on
  // every height change and fight the drag, making tabs behave
  // inconsistently (collapsible on 'home', stuck open on 'search').
  const prevTabRef = useRef(sidebarTab);
  const prevModeRef = useRef(sidebarMode);
  useEffect(() => {
    if (prevTabRef.current !== sidebarTab && height < getDetailHeight()) snapTo(getDetailHeight());
    prevTabRef.current = sidebarTab;
  }, [sidebarTab, height, snapTo]);
  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = sidebarMode;
    if (prev === sidebarMode) return;
    if (['detail', 'facility'].includes(sidebarMode)) {
      // Selecting a venue/facility lowers the tray to the detail height even
      // when it was fully open.
      snapTo(getDetailHeight());
    }
    // Detail/facility closed (close button or a map tap on empty space):
    // lower the tray back to peek so the map is the hero again.
    if (['detail', 'facility'].includes(prev) && !['detail', 'facility'].includes(sidebarMode)) {
      snapTo(SNAP_PEEK);
    }
  }, [sidebarMode, height, snapTo]);

  const renderContent = () => {
    if (sidebarTab === 'saved') return <BookmarkList />;
    if (sidebarTab === 'stats') return <Insights />;
    if (sidebarTab === 'info') return <EventInfo />;

    if (sidebarMode === 'facility')
      return detailLoading ? <TraySkeleton /> : <FacilityDetail />;
    // Same detail mode as desktop: a selected walk-in room wins over the
    // booth card; the store keeps the two mutually exclusive.
    if (sidebarMode === 'detail') {
      if (detailLoading) return <TraySkeleton />;
      return selectedWalkInRoomId ? <WalkInDetail /> : <BoothDetail />;
    }
    // Hall B has no expo booths — show every bilik booking instead.
    if (walkInMode) return <WalkInList />;
    if (counselingMode) return <CounselingList />;
    return <VenueList />;
  };

  return (
    <MapFluidRoot>
      {/* Draggable card — content only; the tab rail lives outside it so
          the tabs never travel with the drag (persistent bottom bar).
          Solid, no blur: translucent/blur layers over a scrollable child
          break touch scrolling on mobile WebKit — same reason Google Maps'
          sheet is fully opaque. */}
      <div
        ref={sheetRef}
        className="pointer-events-auto relative flex flex-col overflow-hidden rounded-t-xl border-t border-zinc-800 bg-[#0c0c0f] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={{
          height,
          transition: isDragging ? 'none' : 'height 380ms cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      >
        {/* Drag handle — taller safe area, kept above the scroll viewport
            so it cannot steal vertical list gestures. */}
        <div
          className="relative flex shrink-0 cursor-grab items-center justify-center pt-3 pb-6 active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          role="separator"
          aria-label="Drag bottom sheet"
          aria-orientation="horizontal"
        >
          <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
        </div>

        {showDragHint && (
          <div className="pointer-events-none px-4 pb-1">
            <div className="mx-auto w-fit rounded-full border border-[var(--accent-pink)]/40 bg-[#1c1c20] px-3 py-1 text-[0.75rem] font-medium text-white shadow-lg">
              Tarik untuk lihat venue
            </div>
          </div>
        )}

        {/* Sheet content — FF ScrollArea (same engine as the desktop list)
            so native touch scrolling is preserved at every snap. */}
        <ScrollArea
          className="min-h-0 flex-1"
          onPointerDown={raiseFromPeek}
          viewportClassName="scroll-fade touch-pan-y overscroll-contain"
        >
          <div className="@container flex flex-col gap-3 px-4 pb-6 pt-3">
            {sidebarTab === 'home' &&
              sidebarMode !== 'detail' &&
              sidebarMode !== 'facility' && <HappeningNow />}
            {renderContent()}
          </div>
        </ScrollArea>
      </div>

      {/* Persistent bottom tab bar — fixed chrome, excluded from the drag */}
      <nav
        ref={railRef}
        data-layout-tune="sheet-tabs"
        className="pointer-events-auto relative flex h-[66px] shrink-0 items-center justify-around border-t border-zinc-800 bg-[#0c0c0f] px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Sheet sections"
        {...hover.handlers}
      >
        <FluidHoverHighlight hover={hover} className="bg-[#262626]" />
        {mobileTabs.map((item, i) => {
          const Icon = item.icon;
          const active = sidebarTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              ref={(el) => hover.registerItem(i, el)}
              onFocus={() => hover.setActiveIndex(i)}
              onClick={() => setTab(item.id)}
              className={`relative flex h-12 w-14 items-center justify-center rounded-sm transition-colors ${
                active ? 'text-white' : 'text-zinc-500'
              }`}
              aria-label={ui.tabs[item.id]}
            >
              <Icon size={23} strokeWidth={active ? 2 : 1.5} />
            </button>
          );
        })}
      </nav>
    </MapFluidRoot>
  );
}
