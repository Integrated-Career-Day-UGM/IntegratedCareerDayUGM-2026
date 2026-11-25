import { useEffect, useRef, useState } from 'react';
import { Store, Handshake, MessagesSquare, Route } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { Tabs, TabsItem } from '../../components/ui/tabs';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { Elevated } from '@/lib/elevated';
import { cn } from '@/lib/utils/cn';
import { event, getVenue, getSessionsByArea, getCompany } from '../../lib/data';

// One icon per track, keyed by track id from event.json.
const trackIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'career-expo': Store,
  'walk-in-interview': Handshake,
  'career-counseling': MessagesSquare,
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
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const venue = getVenue(selectedVenueId);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const visibleTracks = event.tracks
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
            'mx-0 w-fit max-w-full overscroll-x-contain rounded-md border border-line bg-[#0a0a0a] md:w-auto',
            '[&_[role=tab]_span]:text-[0.9375rem] [&_[role=tab]_span]:leading-none md:[&_[role=tab]_span]:text-[0.8125rem]',
          )}
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleTracks.map(({ track, areas }, index) => {
            const Icon = trackIcons[track.id];
            const selected = selectedIndex === index;
            const isOpen = openTrackId === track.id;

            return (
              <div key={track.id} className="relative shrink-0">
                <TabsItem
                  index={index}
                  icon={Icon}
                  label={track.label}
                  className={cn(
                    'relative shrink-0 text-[11px] font-semibold max-md:h-auto max-md:min-h-10 max-md:py-1 max-md:[&_svg]:h-5 max-md:[&_svg]:w-5',
                    selected
                      ? 'flex-none justify-start px-3 max-md:px-4'
                      : 'w-10 justify-center px-0 max-md:w-[57px] md:w-auto md:px-3',
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
            icon={Route}
            label="GIK"
            className={cn(
              'relative shrink-0 text-[11px] font-semibold max-md:h-auto max-md:min-h-10 max-md:py-1 max-md:[&_svg]:h-5 max-md:[&_svg]:w-5',
              gikMode
                ? 'flex-none justify-start px-3 max-md:px-4'
                : 'w-10 justify-center px-0 max-md:w-[57px] md:w-auto md:px-3',
            )}
          />
        </Tabs>
      </div>
    </MapFluidRoot>
  );
}
