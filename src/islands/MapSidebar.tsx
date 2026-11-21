import {
  Home,
  Search,
  Bookmark,
  BarChart3,
  Info,
  CircleHelp,
} from 'lucide-react';
import { useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useBoothFromUrl } from '../hooks/useBoothFromUrl';
import { trackPageView } from '../lib/analytics';
import SearchBar from './SearchBar';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import BoothDetail from './BoothDetail';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import SelectionFrame from '../components/ui/SelectionFrame';
import { event, getTodayDayId, getTodayIso, ui } from '../lib/data';

const mainNavItems: { id: 'home' | 'search' | 'saved' | 'stats'; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'search', icon: Search },
  { id: 'saved', icon: Bookmark },
  { id: 'stats', icon: BarChart3 },
];

// "Integrated Career Days" → two stacked lines in the header lockup.
const [lockupLine1, ...lockupRest] = ui.event.titleLine2.split(' ');
const lockupLine2 = lockupRest.join(' ');

export default function MapSidebar() {
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const setSelectedDay = useMapStore((s) => s.setSelectedDay);
  const sidebarMode = useMapStore((s) => s.sidebarMode);
  const sidebarTab = useMapStore((s) => s.sidebarTab);
  const setSidebarTab = useMapStore((s) => s.setSidebarTab);
  useBoothFromUrl();

  useEffect(() => {
    trackPageView();
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

    if (sidebarMode === 'detail') return <BoothDetail />;
    return <VenueList />;
  };

  return (
    <div className="flex h-full w-full">
      {/* Left icon rail */}
      <nav className="hidden w-[72px] shrink-0 flex-col items-center border-r-2 border-black/40 bg-[#262626] pt-14 sm:flex">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = sidebarTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSidebarTab(item.id)}
              className={`mt-2 flex h-[46px] w-[50px] items-center justify-center rounded-sm transition-colors ${
                active
                  ? 'bg-[#3b3b3b] text-white'
                  : 'text-[#9b9b9b] hover:bg-[#333] hover:text-zinc-300'
              }`}
              aria-label={ui.tabs[item.id]}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.6} />
            </button>
          );
        })}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setSidebarTab('info')}
          className={`mb-6 flex h-[46px] w-[50px] items-center justify-center rounded-sm transition-colors ${
            sidebarTab === 'info'
              ? 'bg-[#3b3b3b] text-white'
              : 'text-[#9b9b9b] hover:bg-[#333] hover:text-zinc-300'
          }`}
          aria-label={ui.tabs.info}
        >
          {sidebarTab === 'info' ? (
            <Info size={22} strokeWidth={2} />
          ) : (
            <CircleHelp size={22} strokeWidth={1.6} />
          )}
        </button>
      </nav>

      {/* Main sidebar content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#1d1d1d]">
        {/* Header — lockup and day picker are independently positioned
            (prototype/Figma geometry) so neither can squeeze the other */}
        <div className="relative h-[150px] shrink-0">
          {/* Rotated badge */}
          <div className="tag-ribbon absolute left-3.5 top-9 z-10">
            {ui.event.exploreBadge}
          </div>

          {/* UGM lockup + selection box (Figma 1742:24528); the frame
              extends past the text on the right and below, per design */}
          <div className="absolute left-4 top-[84px]">
            <SelectionFrame frameClassName="-left-[4px] -top-[5px] -right-[22px] -bottom-[7px]">
              <div
                className="flex items-center gap-[2px]"
                aria-label={ui.event.titleLine1 + ' ' + ui.event.titleLine2}
              >
                <span className="font-heading shrink-0 text-[44px] font-bold leading-[0.8] tracking-[-2px] text-white">
                  {ui.event.titleLine1}
                </span>
                <span className="font-heading shrink-0 whitespace-nowrap text-[18px] font-bold leading-[0.95] tracking-[-0.5px] text-white">
                  {lockupLine1}
                  <br />
                  {lockupLine2}
                </span>
              </div>
            </SelectionFrame>
          </div>

          {/* Day picker — 2×2 staircase of fixed 1:1 boxes: 28 top-left,
              29 bottom-right. Every box is a constant-size square (pink fills
              it when selected), so switching days never changes the layout. */}
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
                        ? 'bg-[#ff2d6f] text-white'
                        : 'text-[#9b9b9b] hover:text-white'
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
        </div>

        {/* Search */}
        <div className="px-3.5 pb-3">
          <SearchBar />
        </div>

        {/* Live session card (full width) */}
        {sidebarTab === 'home' && sidebarMode !== 'detail' && (
          <div className="px-3.5 pb-4 pt-3">
            <HappeningNow />
          </div>
        )}

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-6 pt-2">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}
