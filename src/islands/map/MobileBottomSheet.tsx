import { useRef, useState, useCallback, useEffect } from 'react';
import { Home, Search, Bookmark, BarChart3, Info } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { ScrollArea } from '../../components/ui/scroll-area';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import BoothDetail from './BoothDetail';
import FacilityDetail from './FacilityDetail';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import { ui } from '../../lib/data';


export const SNAP_PEEK = 110;
/** Detail tray height — 30% of the viewport, so the map stays readable. */
const DETAIL_RATIO = 0.3;
const getDetailHeight = () =>
  Math.max(240, Math.round(window.innerHeight * DETAIL_RATIO));
const SNAP_FULL_RATIO = 0.94;
/** Room kept above the fully-raised sheet. The live chrome bottom is read
 *  from `#map-chrome`, so the tray maxes out just under QuickFind. */
const TOP_CLEAR = 24;
/** Tab rail height (h-14). Exported with SNAP_PEEK so map chrome can sit
    above the tray's peek state without hard-coding its height (§1). */
export const TAB_RAIL_H = 56;

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
  // Gliding hover highlight across the tab rail (§0).
  const railRef = useRef<HTMLElement>(null);
  const hover = useFluidHover(railRef, { axis: 'x' });
  const [height, setHeight] = useState<number>(SNAP_PEEK);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const getMaxHeight = () => {
    // Detail/facility mode never takes more than 30% of the screen.
    if (['detail', 'facility'].includes(useMapStore.getState().sidebarMode)) {
      return getDetailHeight();
    }
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
    dragStartY.current = e.clientY;
    startHeight.current = height;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = dragStartY.current - e.clientY;
    const next = startHeight.current + delta;
    snapTo(next);
  };

  const onPointerUp = () => {
    setIsDragging(false);
    const half = getDetailHeight();
    const max = getMaxHeight();
    const midPeekHalf = (SNAP_PEEK + half) / 2;
    const midHalfFull = (half + max) / 2;

    if (height < midPeekHalf) snapTo(SNAP_PEEK);
    else if (height < midHalfFull) snapTo(half);
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
    if (tab === 'search') window.dispatchEvent(new CustomEvent('icd:focus-search'));
  };

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

    if (sidebarMode === 'facility') return <FacilityDetail />;
    if (sidebarMode === 'detail') return <BoothDetail />;
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
        className="pointer-events-auto flex flex-col overflow-hidden rounded-t-xl border-t border-zinc-800 bg-[#0c0c0f] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={{
          height,
          transition: isDragging ? 'none' : 'height 350ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle — taller safe area, kept above the scroll viewport
            so it cannot steal vertical list gestures. */}
        <div
          className="flex shrink-0 cursor-grab items-center justify-center pt-2 pb-4 active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Sheet content — FF ScrollArea (same engine as the desktop list)
            so native touch scrolling is preserved at every snap. */}
        <ScrollArea
          className="min-h-0 flex-1"
          onPointerDown={raiseFromPeek}
          viewportClassName="touch-pan-y overscroll-contain"
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
        className="pointer-events-auto relative flex h-14 shrink-0 items-center justify-around border-t border-zinc-800 bg-[#0c0c0f] px-2"
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
              className={`relative flex h-10 w-12 items-center justify-center rounded-sm transition-colors ${
                active ? 'text-white' : 'text-zinc-500'
              }`}
              aria-label={ui.tabs[item.id]}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
            </button>
          );
        })}
      </nav>
    </MapFluidRoot>
  );
}
