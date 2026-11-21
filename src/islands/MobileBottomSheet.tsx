import { useRef, useState, useCallback } from 'react';
import { Home, Search, Bookmark, BarChart3, Info } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import SearchBar from './SearchBar';
import QuickFind from './QuickFind';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import BoothDetail from './BoothDetail';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import { ui } from '../lib/data';


const SNAP_PEEK = 110;
const SNAP_HALF = 320;
const SNAP_FULL_RATIO = 0.82;

const mobileTabs: { id: 'home' | 'search' | 'saved' | 'stats' | 'info'; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'search', icon: Search },
  { id: 'saved', icon: Bookmark },
  { id: 'stats', icon: BarChart3 },
  { id: 'info', icon: Info },
];

export default function MobileBottomSheet() {
  const { sidebarMode, sidebarTab, setSidebarTab } = useMapStore();
  const [height, setHeight] = useState<number>(SNAP_PEEK);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const getMaxHeight = () => window.innerHeight * SNAP_FULL_RATIO;

  const snapTo = useCallback((target: number) => {
    const max = window.innerHeight * SNAP_FULL_RATIO;
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
    const max = getMaxHeight();
    const midPeekHalf = (SNAP_PEEK + SNAP_HALF) / 2;
    const midHalfFull = (SNAP_HALF + max) / 2;

    if (height < midPeekHalf) snapTo(SNAP_PEEK);
    else if (height < midHalfFull) snapTo(SNAP_HALF);
    else snapTo(max);
  };

  const setTab = (tab: typeof sidebarTab) => {
    setSidebarTab(tab);
    if (height < SNAP_HALF) snapTo(SNAP_HALF);
  };

  const renderContent = () => {
    if (sidebarTab === 'saved') return <BookmarkList />;
    if (sidebarTab === 'stats') return <Insights />;
    if (sidebarTab === 'info') return <EventInfo />;

    if (sidebarMode === 'detail') return <BoothDetail />;
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-zinc-500">{ui.venueList.title}</div>
        <VenueList />
      </div>
    );
  };

  return (
    <div
      ref={sheetRef}
      className="pointer-events-auto flex flex-col rounded-t-xl border-t border-zinc-800 bg-[#0c0c0f]/98 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md will-change-[height]"
      style={{
        height,
        transition: isDragging ? 'none' : 'height 350ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex cursor-grab items-center justify-center py-2 active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-zinc-700" />
      </div>

      {/* Mobile tab rail */}
      <div className="flex items-center justify-around border-b border-zinc-800 px-2 pb-2">
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = sidebarTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-sm transition-colors ${
                active ? 'text-white' : 'text-zinc-500'
              }`}
              aria-label={item.id}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
            </button>
          );
        })}
      </div>

      {/* Sheet content */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-3" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {sidebarTab === 'home' && sidebarMode !== 'detail' && (
          <>
            <SearchBar />
            <QuickFind />
            <HappeningNow />
          </>
        )}
        {sidebarTab === 'search' && sidebarMode !== 'detail' && <SearchBar />}
        {renderContent()}
      </div>
    </div>
  );
}
