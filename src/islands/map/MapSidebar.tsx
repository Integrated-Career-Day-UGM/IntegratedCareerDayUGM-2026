import {
  Home,
  Search,
  Bookmark,
  BarChart3,
  Info,
  CircleHelp,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useMapStore } from '../../stores/mapStore';
import { useBoothFromUrl } from '../../hooks/map/useBoothFromUrl';
import { trackPageView } from '../../lib/analytics';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { spring } from '../../lib/springs';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tooltip } from '../../components/ui/tooltip';
import BrandLockup from '../../components/map/BrandLockup';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import SearchBar from './SearchBar';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import WalkInList from './WalkInList';
import BoothDetail from './BoothDetail';
import WalkInDetail from './WalkInDetail';
import FacilityDetail from './FacilityDetail';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import { event, getTodayDayId, getTodayIso, ui } from '../../lib/data';

const mainNavItems: { id: 'home' | 'search' | 'saved' | 'stats'; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'search', icon: Search },
  { id: 'saved', icon: Bookmark },
  { id: 'stats', icon: BarChart3 },
];

export default function MapSidebar() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const setSelectedDay = useMapStore((s) => s.setSelectedDay);
  const sidebarMode = useMapStore((s) => s.sidebarMode);
  const sidebarTab = useMapStore((s) => s.sidebarTab);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const selectFacility = useMapStore((s) => s.selectFacility);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectedTrackId = useMapStore((s) => s.selectedTrackId);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const clearSearchFilters = useMapStore((s) => s.clearSearchFilters);
  useBoothFromUrl();
  const walkInMode =
    selectedTrackId === 'walk-in-interview' || selectedAreaId === 'hall-b';

  // One gliding hover highlight for the whole rail (§0), replacing the
  // per-button hover classes. Keyboard focus lights it too.
  const railRef = useRef<HTMLElement>(null);
  const hover = useFluidHover(railRef, { axis: 'y' });
  const infoIndex = mainNavItems.length;

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    document.getElementById('sidebar-boot')?.remove();
  }, []);

  // Resolved once per page load, client-side, then cached — stable forever after.
  const todayDayId = getTodayDayId();
  const todayIso = getTodayIso();

  // Days remaining until each event day (negative once a day has passed).
  const countdownByDayId: Record<string, number> = {};
  if (todayIso) {
    for (const day of event.days) {
      countdownByDayId[day.id] = Math.round(
        (Date.parse(`${day.date}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) /
          86_400_000,
      );
    }
  }
  // First event day that hasn't passed yet — gets the T-X countdown chip.
  const upcomingDayId = todayIso
    ? (event.days.find((d) => d.date >= todayIso)?.id ?? null)
    : null;

  // Header chip: "Today" during the event, otherwise a T-X countdown to the
  // next upcoming day; empty slot once the event is over.
  const chip = todayDayId
    ? ui.event.todayBadge
    : upcomingDayId && countdownByDayId[upcomingDayId] > 0
      ? `T-${countdownByDayId[upcomingDayId]}`
      : null;

  const renderMainContent = () => {
    if (sidebarTab === 'saved') return <BookmarkList />;
    if (sidebarTab === 'stats') return <Insights />;
    if (sidebarTab === 'info') return <EventInfo />;

    if (sidebarMode === 'facility') return <FacilityDetail />;
    // Detail mode is shared by booth and walk-in room selections; the store
    // keeps them mutually exclusive, so the career-expo path is unchanged.
    if (sidebarMode === 'detail')
      return selectedWalkInRoomId ? <WalkInDetail /> : <BoothDetail />;
    // Hall B holds no expo booths — the venue list would read "0 booths".
    // List every bilik booking (all days) instead.
    if (walkInMode) return <WalkInList />;
    return <VenueList />;
  };

  return (
    <MapFluidRoot>
      <div className="flex h-full w-full">
        {/* Left icon rail — one gliding highlight per rail, not per-button
            hover styles. Active item: solid pink field + white glyph, no
            side accent (user-chosen language). The pink field is a shared
            layout pill that travels between sections on the FF sidebar's
            `spring.moderate` (0.16s, critically damped) and snaps only on
            reflow; zero corner radius per the user. */}
        <nav
          ref={railRef}
          className="relative hidden w-14 shrink-0 flex-col items-center gap-1.5 border-r border-[#2a2a2a] bg-[#1d1d1d] pt-14 pb-4 md:flex"
          {...hover.handlers}
        >
          <FluidHoverHighlight hover={hover} className="bg-[#2c2c30]" />
          {mainNavItems.map((item, i) => {
            const Icon = item.icon;
            const active = sidebarTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                ref={(el) => hover.registerItem(i, el)}
                onFocus={() => hover.setActiveIndex(i)}
                onClick={() => {
                  if (item.id === 'home') {
                    // Home is the "first state": leave a booth detail and
                    // clear any search query/facets so the card is not left
                    // behind.
                    selectBooth(null);
                    selectFacility(null);
                    setSearchQuery('');
                    clearSearchFilters();
                  }
                  if (item.id === 'search') {
                    // Search is a view switch, not just a tab tint.
                    window.dispatchEvent(new CustomEvent('icd:focus-search'));
                  }
                  setSidebarTab(item.id);
                }}
                className={`relative flex size-10 items-center justify-center ${
                  active ? 'text-white' : 'text-ink-muted'
                }`}
                aria-label={ui.tabs[item.id]}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="rail-active-pill"
                    className="absolute inset-0 bg-[var(--accent-pink)]"
                    transition={spring.moderate}
                  />
                )}
                <Icon className="relative z-10" size={18} strokeWidth={active ? 2 : 1.6} />
              </button>
            );
          })}

          <button
            type="button"
            ref={(el) => hover.registerItem(infoIndex, el)}
            onFocus={() => hover.setActiveIndex(infoIndex)}
            onClick={() => setSidebarTab('info')}
            className={`relative flex size-10 items-center justify-center ${
              sidebarTab === 'info' ? 'text-white' : 'text-ink-muted'
            }`}
            aria-label={ui.tabs.info}
            aria-current={sidebarTab === 'info' ? 'page' : undefined}
          >
            {sidebarTab === 'info' && (
              <motion.span
                layoutId="rail-active-pill"
                className="absolute inset-0 bg-[var(--accent-pink)]"
                transition={spring.moderate}
              />
            )}
            <span className="relative z-10">
              {sidebarTab === 'info' ? (
                <Info size={18} strokeWidth={2} />
              ) : (
                <CircleHelp size={18} strokeWidth={1.6} />
              )}
            </span>
          </button>
        </nav>

      {/* Main sidebar content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#1d1d1d]">
        {/* Header — lockup and day picker are independently positioned
            (prototype/Figma geometry) so neither can squeeze the other */}
        <div className="reveal-product relative h-[150px] shrink-0 border-b border-[#232326]">
          {/* Header brand art (reused compact on mobile) + day picker are
              independently positioned (prototype/Figma geometry) so neither
              can squeeze the other */}
          <BrandLockup />

          {/* Day picker — 2×2 staircase of fixed 1:1 boxes: 28 top-left,
              29 bottom-right. Every box is a constant-size square (pink fills
              it when selected), so switching days never changes the layout.
              The FF tooltip explains the control on first hover. */}
          <Tooltip
            content="Pick a day to switch the schedule"
            side="left"
            sideOffset={10}
            contentClassName="z-[120]"
            className="border border-line bg-[#141416] text-white shadow-surface-3"
          >
            <div className="absolute right-3.5 top-[66px]">
              <div className="grid grid-cols-2">
                {event.days.map((day, i) => (
                  <div
                    key={day.id}
                    className={i === 0 ? 'col-start-1 row-start-1' : 'col-start-2 row-start-2'}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day.id)}
                      className={`flex size-[26px] items-center justify-center text-center font-heading text-[17px] font-bold leading-none transition-all ${
                        selectedDayId === day.id
                          ? 'bg-[var(--accent-pink)] text-white'
                          : 'text-ink-muted hover:text-white'
                      }`}
                    >
                      {day.label}
                    </button>
                  </div>
                ))}
              </div>
              {/* Chip lives in its own container below the grid; fixed size so
                  the label ("Today" ↔ "T-X") never shifts anything */}
              <div
                className={`mt-0.5 bg-white py-[1px] text-center font-heading text-[10px] font-semibold leading-[1.3] text-black ${
                  chip ? '' : 'invisible'
                }`}
              >
                {chip === ui.event.todayBadge ? chip : chip && `${chip} Days`}
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Search + live card + list step in on load (FF reveal-product);
            the Persona-5 header stays outside the stagger. */}
        <div className="reveal-product flex min-h-0 flex-1 flex-col">
          {/* Search */}
          <div className="relative z-30 border-b border-[#232326] px-4 pb-3">
            <SearchBar />
          </div>

          {/* Live session card (full width) */}
          {sidebarTab === 'home' && sidebarMode !== 'detail' && sidebarMode !== 'facility' && (
            <div className="border-b border-[#232326] px-4 pb-4 pt-3">
              <HappeningNow />
            </div>
          )}

          {/* Scrollable content — FF ScrollArea: the bar paints only while
              scrolling (scroll-fade cue); touch keeps native overflow. */}
          <ScrollArea className="min-h-0 flex-1" viewportClassName="scroll-fade">
            <div className="@container px-4 pb-5 pt-2">{renderMainContent()}</div>
          </ScrollArea>
        </div>
      </div>
      </div>
    </MapFluidRoot>
  );
}
