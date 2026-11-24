import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Store, Handshake, MessagesSquare, Route } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
import { ScrollArea } from '../../components/ui/scroll-area';
import { MapFluidRoot } from '../../components/map/map-fluid-root';
import { Elevated } from '@/lib/elevated';
import { event, getVenue, getSessionsByArea, getCompany } from '../../lib/data';

// One icon per track, keyed by track id from event.json.
const trackIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'career-expo': Store,
  'walk-in-interview': Handshake,
  'career-counseling': MessagesSquare,
};

export default function TrackSwitcher({ vertical = false }: { vertical?: boolean }) {
  const selectedVenueId = useMapStore((s) => s.selectedVenueId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const gikMode = useMapStore((s) => s.gikMode);
  const setGikMode = useMapStore((s) => s.setGikMode);
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const venue = getVenue(selectedVenueId);

  // One gliding hover highlight across the strip (§0), replacing the
  // per-pill hover classes.
  const stripRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(stripRef, { axis: vertical ? 'y' : 'x' });

  // Tracks that actually render (a venue may have no area for a track).
  // Precomputed so hover indices are stable across React double-renders.
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

  const strip = (
    <div
      ref={stripRef}
      className={`relative flex w-max ${
        vertical ? 'flex-col items-stretch' : 'flex-nowrap items-center'
      }`}
      {...hover.handlers}
    >
          <FluidHoverHighlight hover={hover} className="bg-[#161616]" />
          {visibleTracks.map(({ track, areas }, i) => {
            const activeArea = areas.find((a) => a.id === selectedAreaId);
            const active = !gikMode && (!!activeArea || (i === 0 && !selectedAreaId));
            const isOpen = openTrackId === track.id;
            const TrackIcon = trackIcons[track.id];

            return (
              <div key={track.id} className="relative shrink-0">
                <button
                  type="button"
                  aria-label={track.label}
                  ref={(el) => hover.registerItem(i, el)}
                  onFocus={() => hover.setActiveIndex(i)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGikMode(false);
                    if (areas.length === 1) {
                      setSelectedArea(areas[0].id);
                      setOpenTrackId(null);
                    } else {
                      setOpenTrackId(isOpen ? null : track.id);
                    }
                  }}
                  className={`relative flex shrink-0 items-center gap-1.5 text-[12px] font-semibold transition-colors after:absolute after:bg-transparent md:text-[13px] ${
                    vertical
                      ? 'h-9 w-9 justify-center border-b border-line after:inset-y-0 after:left-0 after:h-auto after:w-[2px] last:border-b-0'
                      : 'border-r border-line px-2.5 py-2 after:inset-x-0 after:bottom-0 after:h-[2px] last:border-r-0 md:px-3'
                  } ${
                    active
                      ? 'bg-[#1c1c1c] text-white after:bg-[var(--accent-pink)]'
                      : 'text-ink-dim'
                  }`}
                >
                  {TrackIcon && <TrackIcon size={13} className="shrink-0" />}
                  {/* Mobile: inactive tracks collapse to their icon; tapping
                      selects (expands) them. Desktop always shows labels. */}
                  <span className={vertical ? 'hidden' : active ? '' : 'hidden md:inline'}>
                    {track.label}
                  </span>
                  {!vertical && areas.length > 1 && (
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Dropdown — FF Surfaces: level 3 above the chrome so it
                    never melts into the strip or the tiles behind it. */}
                {areas.length > 1 && isOpen && (
                  <Elevated
                    offset={2}
                    className={`track-dropdown absolute z-50 rounded-lg border border-line ${
                      vertical
                        ? 'left-full top-0 ml-1 w-[210px]'
                        : 'left-[-1px] top-full mt-[7px] w-[236px]'
                    }`}
                  >
                    {areas.map((a) => {
                      const sessions = getSessionsByArea(a.id);
                      const firstSession = sessions[0];
                      const company = firstSession ? getCompany(firstSession.companyId) : null;
                      const isActive = a.id === selectedAreaId;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArea(a.id);
                            setOpenTrackId(null);
                          }}
                          className={`block w-full px-3 py-2 text-left transition-colors ${
                            isActive ? 'bg-[var(--accent-pink)] text-white' : 'text-ink-body hover:bg-[#161616]'
                          }`}
                        >
                          <div className="text-[13px] font-semibold leading-tight">{a.name}</div>
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

          {/* GIK — event overview / (later) geojson pathfinding to parking.
              A sibling tab of the tracks: activating it zooms out to the
              whole event location; picking any track returns to the hall
              fit. */}
          <button
            type="button"
            aria-label="GIK"
            ref={(el) => hover.registerItem(visibleTracks.length, el)}
            onFocus={() => hover.setActiveIndex(visibleTracks.length)}
            onClick={(e) => {
              e.stopPropagation();
              setGikMode(true);
              setOpenTrackId(null);
            }}
            className={`relative flex shrink-0 items-center gap-1.5 text-[12px] font-semibold transition-colors after:absolute after:bg-transparent md:text-[13px] ${
              vertical
                ? 'h-9 w-9 justify-center border-b border-line after:inset-y-0 after:left-0 after:h-auto after:w-[2px] last:border-b-0'
                : 'border-r border-line px-2.5 py-2 after:inset-x-0 after:bottom-0 after:h-[2px] last:border-r-0 md:px-3'
            } ${
              gikMode
                ? 'bg-[#1c1c1c] text-white after:bg-[var(--accent-pink)]'
                : 'text-ink-dim'
            }`}
          >
            <Route size={13} className="shrink-0" />
            {/* Mobile: icon-only unless selected, like the track tabs */}
            <span className={vertical ? 'hidden' : gikMode ? '' : 'hidden md:inline'}>GIK</span>
          </button>
    </div>
  );

  return (
    <MapFluidRoot>
      {vertical ? (
        <div
          ref={containerRef}
          className="rounded-md border border-line bg-[#0a0a0a] p-1"
        >
          {strip}
        </div>
      ) : (
        <ScrollArea
          orientation="horizontal"
          className="w-[250px] max-w-full rounded-md border border-line bg-[#0a0a0a] md:w-auto"
          viewportClassName="scroll-fade-x"
        >
          {strip}
        </ScrollArea>
      )}
    </MapFluidRoot>
  );
}
