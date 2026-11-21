import { Bookmark } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { track } from '../lib/analytics';
import { getBoothsByArea, getZonesByArea, getCompanyForBooth, getCompany, ui } from '../lib/data';

export default function VenueList() {
  const {
    selectedAreaId,
    selectBooth,
    selectedBoothId,
    searchQuery,
    toggleBookmark,
    isBookmarked,
  } = useMapStore();

  const handleSelectBooth = (boothId: string) => {
    track('item.click', { boothId, context: searchQuery ? 'search' : 'venue-list' });
    selectBooth(boothId);
  };
  const zones = getZonesByArea(selectedAreaId);
  const allBooths = getBoothsByArea(selectedAreaId);

  const filteredBooths = searchQuery
    ? allBooths.filter((b) => {
        const company = getCompanyForBooth(b.id);
        const q = searchQuery.toLowerCase();
        return (
          b.code.toLowerCase().includes(q) ||
          company?.name.toLowerCase().includes(q) ||
          company?.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : null;

  if (filteredBooths) {
    const count = filteredBooths.length;
    return (
      <div className="space-y-2">
        <div className="sidebar-section-title">
          {ui.search.resultsLabel.replace('{count}', String(count)).replace('{plural}', count === 1 ? '' : 's')}
        </div>
        {count === 0 && (
          <div className="bg-[#4a4a4a] px-3 py-4 text-sm text-[#9b9b9b]">
            {ui.search.emptyResults}
          </div>
        )}
        {filteredBooths.map((booth) => {
          const company = getCompanyForBooth(booth.id);
          const zone = zones.find((z) => z.id === booth.zoneId);
          const bookmarked = isBookmarked(booth.id);
          return (
            <div
              key={booth.id}
              className="flex items-center gap-3 bg-[#4a4a4a] px-3 py-2.5 transition-colors hover:bg-[#555]"
            >
              <button
                type="button"
                onClick={() => handleSelectBooth(booth.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: zone?.color ?? '#27272a' }}
                >
                  {booth.code}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {company?.name ?? booth.label}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {company?.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#3a3a3a] px-1.5 py-0.5 text-[10px] text-[#bbb]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleBookmark(booth.id)}
                className={`shrink-0 p-2 transition-[transform,colors] active:scale-95 ${
                  bookmarked ? 'text-[#ff2d6f]' : 'text-[#9b9b9b] hover:text-white'
                }`}
                aria-label={ui.boothDetail.bookmarkLabel}
              >
                <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {zones.map((zone) => {
        const booths = allBooths.filter((b) => b.zoneId === zone.id);
        if (booths.length === 0) return null;
        return (
          <div
            key={zone.id}
            className="bg-[#4a4a4a] pt-2"
            style={{ borderTopWidth: '10px', borderTopStyle: 'solid', borderTopColor: zone.color }}
          >
            <div className="space-y-0.5 pb-2.5">
              {booths.map((booth) => {
                const company = getCompanyForBooth(booth.id);
                return (
                  <button
                    key={booth.id}
                    type="button"
                    onClick={() => handleSelectBooth(booth.id)}
                    className={`group flex w-full items-center gap-3 px-3 py-1.5 text-left text-[12.5px] font-extrabold leading-tight transition-[transform,colors] active:scale-[0.99] ${
                      selectedBoothId === booth.id
                        ? 'bg-black/25 shadow-[inset_4px_0_0_#ff2d6f] text-white'
                        : 'text-white hover:bg-black/15 hover:shadow-[inset_4px_0_0_#ff2d6f]'
                    }`}
                  >
                    {booth.code}. {company?.name ?? booth.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
