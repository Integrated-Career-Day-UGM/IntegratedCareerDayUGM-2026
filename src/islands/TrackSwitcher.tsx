import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Store, Handshake, MessagesSquare, Route } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { event, getVenue, getSessionsByArea, getCompany } from '../lib/data';

// One icon per track, keyed by track id from event.json.
const trackIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'career-expo': Store,
  'walk-in-interview': Handshake,
  'career-counseling': MessagesSquare,
};

export default function TrackSwitcher() {
  const selectedVenueId = useMapStore((s) => s.selectedVenueId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const gikMode = useMapStore((s) => s.gikMode);
  const setGikMode = useMapStore((s) => s.setGikMode);
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const venue = getVenue(selectedVenueId);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenTrackId(null);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-[250px] max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto"
    >
      {event.tracks.map((track, index) => {
        const areas = venue?.areas.filter((a) => a.trackId === track.id) ?? [];
        const activeArea = areas.find((a) => a.id === selectedAreaId);
        const active = !gikMode && (!!activeArea || (index === 0 && !selectedAreaId));
        const isOpen = openTrackId === track.id;
        const TrackIcon = trackIcons[track.id];

        if (areas.length === 0) return null;

        return (
          <div key={track.id} className="relative shrink-0">
            <button
              type="button"
              aria-label={track.label}
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
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:px-3 sm:text-[13px] ${
                active
                  ? 'bg-[#1c1c1c] text-white shadow-[inset_0_-2px_0_#ff2d6f]'
                  : 'text-[#8f8f8f] hover:bg-[#161616] hover:text-white'
              }`}
            >
              {TrackIcon && <TrackIcon size={13} className="shrink-0" />}
              {/* Mobile: inactive tracks collapse to their icon; tapping
                  selects (expands) them. Desktop always shows labels. */}
              <span className={active ? '' : 'hidden sm:inline'}>{track.label}</span>
              {areas.length > 1 && (
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Dropdown — prototype .menu styling */}
            {areas.length > 1 && isOpen && (
              <div className="track-dropdown absolute left-[-1px] top-full z-50 mt-[7px] w-[236px] rounded-lg border border-[#2a2a2a] bg-[#0a0a0a]">
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
                        isActive ? 'bg-[#ff2d6f] text-white' : 'text-[#ededed] hover:bg-[#161616]'
                      }`}
                    >
                      <div className="text-[13px] font-semibold leading-tight">{a.name}</div>
                      {company && (
                        <small
                          className={`block text-[11px] font-normal ${
                            isActive ? 'text-white/80' : 'text-[#8f8f8f]'
                          }`}
                        >
                          {company.name}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* GIK — event overview / (later) geojson pathfinding to parking.
          A sibling tab of the tracks: activating it zooms out to the whole
          event location; picking any track returns to the hall fit. */}
      <button
        type="button"
        aria-label="GIK"
        onClick={(e) => {
          e.stopPropagation();
          setGikMode(true);
          setOpenTrackId(null);
        }}
        className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:px-3 sm:text-[13px] ${
          gikMode
            ? 'bg-[#1c1c1c] text-white shadow-[inset_0_-2px_0_#ff2d6f]'
            : 'text-[#8f8f8f] hover:bg-[#161616] hover:text-white'
        }`}
      >
        <Route size={13} className="shrink-0" />
        {/* Mobile: icon-only unless selected, like the track tabs */}
        <span className={gikMode ? '' : 'hidden sm:inline'}>GIK</span>
      </button>
    </div>
  );
}
