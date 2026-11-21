import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { event, getVenue, getSessionsByArea, getCompany } from '../lib/data';

export default function TrackSwitcher() {
  const { selectedVenueId, selectedAreaId, setSelectedArea } = useMapStore();
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
    <div ref={containerRef} className="flex flex-nowrap items-start gap-1.5">
      {event.tracks.map((track, index) => {
        const areas = venue?.areas.filter((a) => a.trackId === track.id) ?? [];
        const activeArea = areas.find((a) => a.id === selectedAreaId);
        const active = !!activeArea || (index === 0 && !selectedAreaId);
        const isOpen = openTrackId === track.id;

        if (areas.length === 0) return null;

        return (
          <div key={track.id} className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (areas.length === 1) {
                  setSelectedArea(areas[0].id);
                  setOpenTrackId(null);
                } else {
                  setOpenTrackId(isOpen ? null : track.id);
                }
              }}
              className={`relative inline-flex h-9 items-center gap-1.5 px-3 text-[19px] font-semibold tracking-[-0.3px] shadow-sm transition-colors ${
                active
                  ? 'bg-[#3a3a3a] text-white'
                  : 'bg-[#161616] text-white hover:bg-[#222]'
              }`}
            >
              {track.label}
              {areas.length > 1 && (
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Dropdown */}
            {areas.length > 1 && isOpen && (
              <div className="track-dropdown absolute left-0 top-full z-50 mt-1.5 w-56 origin-top-left overflow-hidden bg-[#8e8e8e] shadow-xl">
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
                      className={`flex w-full items-start gap-2 py-1.5 pl-11 pr-3 text-left transition-colors ${
                        isActive
                          ? 'bg-[#ff2d6f] text-white'
                          : 'text-white hover:bg-[#7a7a7a]'
                      }`}
                    >
                      <span className="absolute left-3 top-1 text-[28px] font-normal leading-none">↳</span>
                      <div>
                        <div className="text-base font-semibold leading-tight">{a.name}</div>
                        {company && (
                          <div className={`text-[10px] font-semibold opacity-80 ${isActive ? 'text-white' : 'text-white'}`}>
                            {company.name}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
