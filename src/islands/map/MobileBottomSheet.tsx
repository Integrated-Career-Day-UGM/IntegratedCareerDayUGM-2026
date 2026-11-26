import { useRef, useState, useCallback, useEffect, useId } from 'react';
import { Home, Search, Bookmark, BarChart3, Info, ChevronLeft } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { ScrollArea } from '../../components/ui/scroll-area';
import SearchBar from './SearchBar';
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
import { settleTrayHeight, trayDetailTarget, trayKeyboardLift, trayViewportHeight } from '../../lib/map/tray';


export const SNAP_PEEK = 110;
/** Opening height for the tray — search and venue detail both start here. */
const DETAIL_MAX_RATIO = 0.5;
const SEARCH_RATIO = 0.7;
const SNAP_FULL_RATIO = 0.7;
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

/** Height motion for the tray; disabled for reduced-motion users. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduce;
}

export default function MobileBottomSheet() {
  const sidebarMode = useMapStore((s) => s.sidebarMode);
  const sidebarTab = useMapStore((s) => s.sidebarTab);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const closeDetail = useMapStore((s) => s.closeDetail);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectedFacilityId = useMapStore((s) => s.selectedFacilityId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectedTrackId = useMapStore((s) => s.selectedTrackId);
  const walkInMode =
    selectedTrackId === 'walk-in-interview' || selectedAreaId === 'hall-b';
  const counselingMode =
    selectedTrackId === 'career-counseling' || selectedAreaId === 'pp-kagama';
  const detailMode = ['detail', 'facility'].includes(sidebarMode);
  // Gliding hover highlight across the tab rail (§0).
  const railRef = useRef<HTMLElement>(null);
  const hover = useFluidHover(railRef, { axis: 'x' });
  const [height, setHeight] = useState<number>(() => trayDetailTarget());
  const [keyboardLift, setKeyboardLift] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Mirror of `isDragging` for handlers that must not re-bind (resize,
  // lost-capture): state alone is a render behind.
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  // Set when a map tap explicitly asks for the collapsed tray; the
  // detail-close effect must not re-raise it to show list results.
  const collapseRequestedRef = useRef(false);
  // Keyboard open/close bookkeeping: restore the detent the user was on
  // before the keyboard clamped the sheet.
  const keyboardLiftRef = useRef(0);
  const preKeyboardHeightRef = useRef(0);
  const reduceMotion = useReduceMotion();
  const trayId = useId();

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

  const getBaseMaxHeight = () => {
    const viewportH = trayViewportHeight();
    const chrome = document.getElementById('map-chrome');
    const chromeBottom = chrome
      ? chrome.getBoundingClientRect().bottom
      : TOP_CLEAR;
    const topClear = Math.max(TOP_CLEAR, chromeBottom + 8);
    // The tab rail sits below the sheet, so subtract it from the viewport
    // budget before capping the sheet. Never below peek.
    return Math.max(
      SNAP_PEEK,
      Math.min(
        viewportH - topClear - TAB_RAIL_H,
        viewportH * SNAP_FULL_RATIO,
      ),
    );
  };

  // Short/landscape viewports: every detent is clamped to the base max so a
  // snap target can never exceed the room the sheet actually has.
  const getDetailHeight = () =>
    Math.min(trayDetailTarget(), getBaseMaxHeight());
  const getDetailMaxHeight = () =>
    Math.min(
      Math.max(240, Math.round(trayViewportHeight() * DETAIL_MAX_RATIO)),
      getBaseMaxHeight(),
    );
  const getSearchHeight = () =>
    Math.min(
      Math.max(320, Math.round(trayViewportHeight() * SEARCH_RATIO)),
      getBaseMaxHeight(),
    );

  const getMaxHeight = () => {
    const state = useMapStore.getState();
    // Detail/facility can be pulled to half the viewport; search is capped
    // at its opening height. Other tabs keep the full sheet.
    if (['detail', 'facility'].includes(state.sidebarMode)) {
      return Math.max(
        SNAP_PEEK,
        Math.min(getDetailMaxHeight(), getBaseMaxHeight()),
      );
    }
    if (state.sidebarTab === 'search') return getSearchHeight();
    return getBaseMaxHeight();
  };

  const snapTo = useCallback((target: number) => {
    const max = getMaxHeight();
    setHeight(Math.max(SNAP_PEEK, Math.min(max, target)));
  }, []);

  const setDragging = (dragging: boolean) => {
    isDraggingRef.current = dragging;
    setIsDragging(dragging);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    setDragging(true);
    dragMovedRef.current = false;
    setShowDragHint(false);
    try {
      window.localStorage.setItem('icd:tray-drag-hint', '1');
    } catch {
      // Private mode.
    }
    dragStartY.current = e.clientY;
    startHeight.current = height;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) return;
    if (Math.abs(e.clientY - dragStartY.current) > 4) dragMovedRef.current = true;
    const delta = dragStartY.current - e.clientY;
    const raw = startHeight.current + delta;
    const max = getMaxHeight();
    // Android-style rubber band: past the cap the tray still follows the
    // finger, but with heavy resistance, then springs back on release.
    const resisted =
      raw > max ? max + Math.min(28, (raw - max) * 0.18) : raw;
    setHeight(Math.max(SNAP_PEEK, resisted));
  };

  // One settle path for pointerup, pointercancel and a lost capture (OS
  // gesture, tab switch): without it `isDragging` could stick true and the
  // transition stays 'none', freezing the tray mid-drag.
  const endDrag = () => {
    if (!isDraggingRef.current) return;
    setDragging(false);
    // Read the rendered height: React state can be one frame behind the last
    // pointermove, and the rubber-band snap must use the real position.
    const currentHeight = sheetRef.current?.getBoundingClientRect().height ?? height;
    setHeight(
      settleTrayHeight(currentHeight, SNAP_PEEK, getDetailHeight(), getMaxHeight()),
    );
  };

  /** Tap: peek ↔ half. A drag that ended with a click must not toggle. */
  const toggleExpanded = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    if (height <= SNAP_PEEK + 1) snapTo(Math.min(getDetailHeight(), getMaxHeight()));
    else snapTo(SNAP_PEEK);
  };

  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const max = getMaxHeight();
    const step = 48;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      snapTo(Math.min(max, height + step));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      snapTo(Math.max(SNAP_PEEK, height - step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      snapTo(SNAP_PEEK);
    } else if (e.key === 'End') {
      e.preventDefault();
      snapTo(max);
    }
  };

  // The viewport is not stable on mobile: the Safari address bar resizes the
  // layout viewport on scroll, the keyboard shrinks the visual viewport and
  // rotation changes both. Re-clamp, never fight an active drag.
  useEffect(() => {
    const clamp = () => {
      if (isDraggingRef.current) return;
      const nextLift = trayKeyboardLift();
      if (nextLift > 0 && keyboardLiftRef.current === 0) {
        preKeyboardHeightRef.current =
          sheetRef.current?.getBoundingClientRect().height ?? height;
      } else if (nextLift === 0 && keyboardLiftRef.current > 0) {
        const restore = preKeyboardHeightRef.current;
        preKeyboardHeightRef.current = 0;
        if (restore) snapTo(restore);
      }
      keyboardLiftRef.current = nextLift;
      setKeyboardLift(nextLift);
      const max = getMaxHeight();
      setHeight((current) => Math.max(SNAP_PEEK, Math.min(max, current)));
    };
    clamp();
    window.addEventListener('resize', clamp);
    window.addEventListener('orientationchange', clamp);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', clamp);
    viewport?.addEventListener('scroll', clamp);
    return () => {
      window.removeEventListener('resize', clamp);
      window.removeEventListener('orientationchange', clamp);
      viewport?.removeEventListener('resize', clamp);
      viewport?.removeEventListener('scroll', clamp);
    };
  }, []);

  /** Touching the list at peek raises the tray enough for a real scroll. */
  const raiseFromPeek = () => {
    const mode = useMapStore.getState().sidebarMode;
    if (['detail', 'facility'].includes(mode)) return;
    if (height <= SNAP_PEEK + 1) snapTo(getDetailHeight());
  };

  const setTab = (tab: typeof sidebarTab) => {
    // Height + focus for the search tab are handled by the effects below;
    // doing it here too double-snaps before the SearchBar is mounted.
    setSidebarTab(tab);
  };

  useEffect(() => {
    const raiseForSearch = () => snapTo(getSearchHeight());
    window.addEventListener('icd:focus-search', raiseForSearch);
    return () => window.removeEventListener('icd:focus-search', raiseForSearch);
  }, [snapTo]);

  useEffect(() => {
    const collapse = () => {
      collapseRequestedRef.current = true;
      snapTo(SNAP_PEEK);
    };
    window.addEventListener('icd:tray-collapse', collapse);
    return () => window.removeEventListener('icd:tray-collapse', collapse);
  }, [snapTo]);

  useEffect(() => {
    const viewport = contentScrollRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    viewport?.scrollTo({ top: 0, behavior: 'auto' });
  }, [
    sidebarTab,
    sidebarMode,
    selectedBoothId,
    selectedFacilityId,
    selectedWalkInRoomId,
  ]);

  // The SearchBar is mounted by the tab switch, so dispatch focus after the
  // sheet content has rendered.
  useEffect(() => {
    if (sidebarTab !== 'search') return;
    const raf = window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent('icd:focus-search')),
    );
    return () => window.cancelAnimationFrame(raf);
  }, [sidebarTab]);

  // Raise the sheet when the content context changes — a tab switch (the
  // top search bar focuses 'search' too) or a booth detail opening — but
  // ONLY on the transition itself. An unconditional effect would re-fire on
  // every height change and fight the drag, making tabs behave
  // inconsistently (collapsible on 'home', stuck open on 'search').
  const prevTabRef = useRef(sidebarTab);
  const prevModeRef = useRef(sidebarMode);
  useEffect(() => {
    if (prevTabRef.current !== sidebarTab) {
      const target = sidebarTab === 'search' ? getSearchHeight() : getDetailHeight();
      if (height < target) snapTo(target);
    }
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
    // Detail/facility closed (close button, back button, or a map tap on
    // empty space): land where the card came from. A map tap explicitly
    // collapses to peek (map is the hero); closing a card that opened from
    // Search/Saved re-shows those results instead of hiding them at peek.
    if (['detail', 'facility'].includes(prev) && !['detail', 'facility'].includes(sidebarMode)) {
      const explicitCollapse = collapseRequestedRef.current;
      collapseRequestedRef.current = false;
      const tab = useMapStore.getState().sidebarTab;
      const target = explicitCollapse || tab === 'home' ? SNAP_PEEK : getSearchHeight();
      snapTo(target);
    }
  }, [sidebarMode, height, snapTo]);

  const renderContent = () => {
    // Detail is a mode, not a tab: it renders over the tab it was opened
    // from so closing returns to those results instead of Home.
    if (sidebarMode === 'facility')
      return detailLoading ? <TraySkeleton /> : <FacilityDetail />;
    // Same detail mode as desktop: a selected walk-in room wins over the
    // booth card; the store keeps the two mutually exclusive.
    if (sidebarMode === 'detail') {
      if (detailLoading) return <TraySkeleton />;
      return selectedWalkInRoomId ? <WalkInDetail /> : <BoothDetail />;
    }

    if (sidebarTab === 'search') {
      return (
        <div className="flex flex-col gap-3">
          <SearchBar tuneFilter />
          <VenueList />
        </div>
      );
    }
    if (sidebarTab === 'saved') return <BookmarkList />;
    if (sidebarTab === 'stats') return <Insights />;
    if (sidebarTab === 'info') return <EventInfo />;

    // Hall B has no expo booths — show every bilik booking instead.
    if (walkInMode) return <WalkInList />;
    if (counselingMode) return <CounselingList />;
    return <VenueList />;
  };

  return (
    <MapFluidRoot>
      {/* Keyboard lift: iOS shrinks only the visual viewport, so the tray is
          translated up instead of relying on a layout resize. */}
      <div
        style={{
          transform: keyboardLift ? `translateY(-${keyboardLift}px)` : undefined,
        }}
      >
      {/* Draggable card — content only; the tab rail lives outside it so
          the tabs never travel with the drag (persistent bottom bar).
          Solid, no blur: translucent/blur layers over a scrollable child
          break touch scrolling on mobile WebKit — same reason Google Maps'
          sheet is fully opaque. */}
      <div
        ref={sheetRef}
        id={trayId}
        className="pointer-events-auto relative flex flex-col overflow-hidden rounded-t-xl border-t border-zinc-800 bg-[#0c0c0f] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={{
          height,
          // With the tab rail hidden (detail mode) the sheet itself owns the
          // home-indicator inset, or the last action row sits under it.
          paddingBottom: detailMode ? 'env(safe-area-inset-bottom)' : undefined,
          transition:
            isDragging || reduceMotion || keyboardLift > 0
              ? 'none'
              : 'height 380ms cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      >
        {/* Drag handle — taller safe area, kept above the scroll viewport
            so it cannot steal vertical list gestures. It is a button, not a
            separator: tap toggles peek/half, arrows and Home/End resize, so
            the sheet never depends on a swipe gesture alone. */}
        <button
          type="button"
          className="relative flex w-full shrink-0 cursor-grab touch-none items-center justify-center pt-3 pb-6 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onClick={toggleExpanded}
          onKeyDown={onHandleKeyDown}
          aria-expanded={height > SNAP_PEEK + 1}
          aria-controls={trayId}
          aria-label={height > SNAP_PEEK + 1 ? 'Perkecil panel' : 'Perluas panel'}
        >
          <span className="h-1.5 w-12 rounded-full bg-zinc-700" />
        </button>

        {/* Detail is a mode: one always-visible way back, in addition to the
            card's X and the system/back gesture. */}
        {detailMode && (
          <button
            type="button"
            onClick={closeDetail}
            className="flex h-10 shrink-0 items-center gap-1 border-b border-[#232326] px-3 text-[0.75rem] font-semibold text-[#a1a1aa] transition-colors active:text-white md:hover:text-white"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Kembali
          </button>
        )}

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
          ref={contentScrollRef}
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
        className={`pointer-events-auto relative flex shrink-0 items-center justify-around overflow-hidden border-t border-zinc-800 bg-[#0c0c0f] px-2 transition-[height,transform,opacity] duration-300 ${
          detailMode
            ? 'pointer-events-none h-0 translate-y-full border-t-0 opacity-0'
            : 'h-[66px]'
        }`}
        style={{ paddingBottom: detailMode ? 0 : 'env(safe-area-inset-bottom)' }}
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
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={23} strokeWidth={active ? 2 : 1.5} />
            </button>
          );
        })}
      </nav>
      </div>
    </MapFluidRoot>
  );
}
