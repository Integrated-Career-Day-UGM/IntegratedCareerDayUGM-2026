import {
  Home,
  Search,
  Bookmark,
  BarChart3,
  Info,
  CircleHelp,
} from 'lucide-react';
import { Fragment, useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useBoothFromUrl } from '../hooks/useBoothFromUrl';
import { trackPageView } from '../lib/analytics';
import SearchBar from './SearchBar';
import QuickFind from './QuickFind';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import BoothDetail from './BoothDetail';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import SelectionFrame from '../components/ui/SelectionFrame';
import { event, getTodayDayId, ui } from '../lib/data';

const mainNavItems: { id: 'home' | 'search' | 'saved' | 'stats'; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'search', icon: Search },
  { id: 'saved', icon: Bookmark },
  { id: 'stats', icon: BarChart3 },
];

export default function MapSidebar() {
  const { selectedDayId, setSelectedDay, sidebarMode, sidebarTab, setSidebarTab } = useMapStore();
  useBoothFromUrl();

  useEffect(() => {
    trackPageView();
  }, []);

  // Resolved once per page load, client-side, then cached — stable forever after.
  const todayDayId = getTodayDayId();

  const renderMainContent = () => {
    if (sidebarTab === 'saved') return <BookmarkList />;
    if (sidebarTab === 'stats') return <Insights />;
    if (sidebarTab === 'info') return <EventInfo />;

    if (sidebarMode === 'detail') return <BoothDetail />;
    return (
      <div className="space-y-3">
        <div className="sidebar-section-title">{ui.venueList.title}</div>
        <VenueList />
      </div>
    );
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
        {/* Header */}
        <div className="relative h-[150px] shrink-0 px-3.5 pt-8">
          {/* Rotated badge */}
          <div className="tag-ribbon absolute left-3.5 top-9 z-10">
            {ui.event.exploreBadge}
          </div>

          {/* Lockup + day picker share one flex row so they can never overlap */}
          <div className="flex items-start justify-between gap-2 pt-9">
            {/* UGM lockup + selection box (top title) */}
            <div className="mt-1 min-w-0 pl-1">
              <SelectionFrame>
                <div className="px-0.5 py-0.5">
                  <img
                    src="/images/ugm-lockup.svg"
                    alt="UGM Integrated Career Days"
                    className="h-[52px] w-auto"
                    draggable={false}
                  />
                </div>
              </SelectionFrame>
            </div>

            {/* Day picker */}
            <div className="flex w-[64px] shrink-0 flex-col items-center pt-1">
              {event.days.map((day) => (
                <Fragment key={day.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(day.id)}
                    className={`font-heading text-[21px] font-extrabold leading-[1.1] transition-all ${
                      selectedDayId === day.id
                        ? 'bg-[#ff2d6f] px-2.5 text-white'
                        : 'ml-3 text-[#9b9b9b] hover:text-white'
                    }`}
                  >
                    {day.label}
                  </button>
                  {day.id === todayDayId && (
                    <span className="mt-0.5 bg-white px-2 py-0.5 font-heading text-[12px] font-semibold text-black">
                      {ui.event.todayBadge}
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3.5 pb-3">
          <SearchBar />
        </div>

        {/* Quick find + now */}
        {sidebarTab === 'home' && sidebarMode !== 'detail' && (
          <div className="flex gap-0 border-t-2 border-black/40 px-3.5 py-3">
            <div className="flex-1 pr-2">
              <QuickFind />
            </div>
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
