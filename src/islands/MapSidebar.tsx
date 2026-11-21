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
import QuickFind from './QuickFind';
import HappeningNow from './HappeningNow';
import VenueList from './VenueList';
import BoothDetail from './BoothDetail';
import BookmarkList from './BookmarkList';
import Insights from './Insights';
import EventInfo from './EventInfo';
import { event, ui } from '../lib/data';

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

  const isToday = (dayId: string) => dayId === event.days[0].id;

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

          {/* UGM lockup + selection box */}
          <div className="absolute left-4 top-20">
            <div className="relative inline-flex items-start gap-1">
              {/* Pink selection outline */}
              <div className="selection-box pointer-events-none absolute -inset-x-1 -inset-y-1.5 z-0">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 overflow-visible">
                  <rect x="0" y="0" width="100" height="100" fill="none" stroke="#ff2d6f" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  <rect x="-2" y="-2" width="6" height="6" fill="#ff2d6f" />
                  <rect x="96" y="-2" width="6" height="6" fill="#ff2d6f" />
                  <rect x="-2" y="96" width="6" height="6" fill="#ff2d6f" />
                  <rect x="96" y="96" width="6" height="6" fill="#ff2d6f" />
                </svg>
                {/* Cursor */}
                <svg className="absolute -right-5 -top-5 h-8 w-8 text-[#ff2d6f]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3l7.2 18.6 2.9-8.7L21.6 10.3 3 3z" />
                  <path d="M11.5 13.5l8.5 8.5" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="relative z-10">
                <h1 className="font-heading text-[54px] font-black leading-[0.8] tracking-[-4px] text-white">
                  {ui.event.titleLine1}
                </h1>
              </div>
              <div className="relative z-10 pt-1">
                <div className="font-heading text-[21px] font-semibold leading-[0.95] tracking-[-0.5px] text-white">
                  {ui.event.titleLine2.split(' ')[0]}
                  <br />
                  {ui.event.titleLine2.split(' ').slice(1).join(' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Day picker with offsets */}
          <div className="absolute right-3.5 top-[76px] flex w-[60px] flex-col items-center">
            {event.days.map((day, index) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`font-heading text-[21px] font-extrabold leading-[1.1] transition-all ${
                  selectedDayId === day.id
                    ? 'bg-[#ff2d6f] px-2.5 text-white'
                    : 'ml-3 text-[#9b9b9b] hover:text-white'
                }`}
                style={{ marginTop: index === 0 ? 0 : -2 }}
              >
                {day.label}
              </button>
            ))}
            {isToday(selectedDayId) && (
              <span className="mt-1 bg-white px-2 py-0.5 font-heading text-[12px] font-semibold text-black">
                {ui.event.todayBadge}
              </span>
            )}
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
