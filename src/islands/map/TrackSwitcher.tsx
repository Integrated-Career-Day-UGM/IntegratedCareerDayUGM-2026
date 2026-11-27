import { useEffect, useRef, useState } from 'react';
import {
  IconBriefcase,
  IconBriefcaseFilled,
  IconLayoutGrid,
  IconLayoutGridFilled,
  IconNavigation,
  IconNavigationFilled,
} from '@tabler/icons-react';
import { useMapStore } from '../../stores/mapStore';
import { Tabs, TabsItem } from '../../components/ui/tabs';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { Elevated } from '@/lib/elevated';
import { cn } from '@/lib/utils/cn';
import { event, getVenue, getSessionsByArea, getCompany } from '../../lib/data';

// Outline + filled pair per track, keyed by track id from event.json. The
// filled variant is the selected state; counseling has no tab (it is a
// tooltip on the PP KAGAMA booth instead).
const trackIcons: Record<
  string,
  { outline: React.ComponentType<{ size?: number; className?: string }>; filled: React.ComponentType<{ size?: number; className?: string }> }
> = {
  'career-expo': { outline: IconLayoutGrid, filled: IconLayoutGridFilled },
  'walk-in-interview': { outline: IconBriefcase, filled: IconBriefcaseFilled },
};

/**
 * Track switcher built on the FF Tabs primitive: activeLabel expands only
 * the selected tab, every other tab stays icon-sized. The same behaviour is
 * used at every breakpoint; the compact size step keeps the type small.
 */
export default function TrackSwitcher() {
  const selectedVenueId = useMapStore((s) => s.selectedVenueId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const gikMode = useMapStore((s) => s.gikMode);
  const setGikMode = useMapStore((s) => s.setGikMode);
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const venue = getVenue(selectedVenueId);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const visibleTracks = event.tracks
    .filter((track) => track.id !== 'career-counseling')
    .map((track) => ({
      track,
      areas: venue?.areas.filter((a) => a.trackId === track.id) ?? [],
    }))
    .filter(({ areas }) => areas.length > 0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenTrackId(null);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const activeTrackIndex = visibleTracks.findIndex(({ areas }) =>
    areas.some((area) => area.id === selectedAreaId),
  );
  const selectedIndex = gikMode
    ? visibleTracks.length
    : activeTrackIndex >= 0
      ? activeTrackIndex
      : 0;

  // Keep the selected tab visible when the strip scrolls (the mobile row is
  // narrower than the four tabs with the active label expanded).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const selectedTab = container.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    );
    selectedTab?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [selectedIndex]);

  const onSelect = (index: number) => {
    setOpenTrackId(null);
    if (index === visibleTracks.length) {
      setGikMode(true);
      return;
    }

    const next = visibleTracks[index];
    setGikMode(false);
    if (!next) return;
    if (next.areas.length <= 1) {
      if (next.areas[0]) setSelectedArea(next.areas[0].id);
    } else {
      setOpenTrackId(next.track.id);
    }
  };

  return (
    <MapFluidRoot>
      <div ref={containerRef} className="contents">
        <Tabs
          activeLabel={!isDesktop}
          size="compact"
          idPrefix="track"
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          className={cn(
            'mx-0 w-fit max-w-full overscroll-x-contain rounded-[18px] border border-line bg-[#0a0a0a] lg:w-auto lg:rounded-md',
            'max-lg:[&>div.bg-active]:rounded-[14px]',
            '[&_[role=tab]_span]:text-[0.9375rem] [&_[role=tab]_span]:leading-none lg:[&_[role=tab]_span]:text-base lg:[&_svg]:h-5 lg:[&_svg]:w-5',
          )}
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleTracks.map(({ track, areas }, index) => {
            const icons = trackIcons[track.id];
            const selected = selectedIndex === index;
            const Icon = selected ? (icons?.filled ?? icons?.outline) : icons?.outline;
            const isOpen = openTrackId === track.id;

            return (
              <div key={track.id} className="relative shrink-0">
                <TabsItem
                  index={index}
                  icon={Icon}
                  label={track.label}
                  className={cn(
                    'relative shrink-0 text-[11px] font-semibold max-lg:h-auto max-lg:min-h-10 max-lg:py-1 max-lg:[&_svg]:h-5 max-lg:[&_svg]:w-5 lg:min-h-[52px] lg:py-2',
                    selected
                      ? 'flex-none justify-start px-3 max-lg:px-4 lg:px-5'
                      : 'w-10 justify-center px-0 max-lg:w-[57px] lg:w-auto lg:px-5',
                  )}
                />

                {areas.length > 1 && isOpen && (
                  <Elevated
                    offset={2}
                    className="track-dropdown absolute left-[-1px] top-full z-50 mt-[7px] w-[236px] rounded-lg border border-line"
                  >
                    {areas.map((area) => {
                      const sessions = getSessionsByArea(area.id);
                      const firstSession = sessions[0];
                      const company = firstSession ? getCompany(firstSession.companyId) : null;
                      const isActive = area.id === selectedAreaId;
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedArea(area.id);
                            setOpenTrackId(null);
                          }}
                          className={`block w-full px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-[var(--accent-pink)] text-white'
                              : 'text-ink-body hover:bg-[#161616]'
                          }`}
                        >
                          <div className="text-[13px] font-semibold leading-tight">
                            {area.name}
                          </div>
                          {company && (
                            <small
                              className={`block text-[11px] font-normal ${
                                isActive ? 'text-white/80' : 'text-ink-dim'
                              }`}
                            >
                              {company.name}
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </Elevated>
                )}
              </div>
            );
          })}

          <TabsItem
            index={visibleTracks.length}
            icon={gikMode ? IconNavigationFilled : IconNavigation}
            label="GIK"
            className={cn(
              'relative shrink-0 text-[11px] font-semibold max-lg:h-auto max-lg:min-h-10 max-lg:py-1 max-lg:[&_svg]:h-5 max-lg:[&_svg]:w-5 lg:min-h-[52px] lg:py-2',
              gikMode
                ? 'flex-none justify-start px-3 max-lg:px-4'
                : 'w-10 justify-center px-0 max-lg:w-[57px] lg:w-auto lg:px-3',
            )}
          />
        </Tabs>
      </div>
    </MapFluidRoot>
  );
}
