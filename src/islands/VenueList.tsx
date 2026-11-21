import { Bookmark } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { track } from '../lib/analytics';
import { getBoothsByArea, getZonesByArea, getCompanyForBooth, getCompany, ui } from '../lib/data';

/** "zone-c" → "C" for the ZONE X header, like the reference list. */
const zoneCode = (id: string) => id.replace(/^zone-/, '').toUpperCase();

// Shared style for booth rows (Claude reference: 13px/600, code column,
// pink inset bar on hover/active).
const rowState = (selected: boolean) =>
  selected
    ? 'bg-[#181818] shadow-[inset_3px_0_0_#ff2d6f]'
    : 'transition-colors hover:bg-[#181818] hover:shadow-[inset_3px_0_0_#ff2d6f]';

function BoothRow({
  boothCode,
  name,
  selected,
  onClick,
  bookmarked,
  onToggleBookmark,
  bookmarkLabel,
}: {
  boothCode: string;
  name: string;
  selected: boolean;
  onClick: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  bookmarkLabel?: string;
}) {
  return (
    <div className={`relative flex items-center ${rowState(selected)}`}>
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-[7px] text-left text-[13px] font-semibold leading-[1.2]"
      >
        <span
          className={`font-heading min-w-[30px] shrink-0 text-[13px] font-bold ${
            selected ? 'text-[#ededed]' : 'text-[#8f8f8f]'
          }`}
        >
          {boothCode}
        </span>
        <span className="truncate text-[#ededed]">{name}</span>
      </button>
      {onToggleBookmark && (
        <button
          type="button"
          onClick={onToggleBookmark}
          className={`shrink-0 p-2 transition-[transform,colors] active:scale-95 ${
            bookmarked ? 'text-[#ff2d6f]' : 'text-[#8f8f8f] hover:text-white'
          }`}
          aria-label={bookmarkLabel}
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

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
      <div>
        <div className="mb-2.5 flex justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
          <span>
            {ui.search.resultsLabel.replace('{count}', String(count)).replace('{plural}', count === 1 ? '' : 's')}
          </span>
        </div>
        {count === 0 ? (
          <div className="border border-[#2a2a2a] bg-[#111] px-3 py-4 text-[13px] text-[#8f8f8f]">
            {ui.search.emptyResults}
          </div>
        ) : (
          <div className="border border-[#2a2a2a] bg-[#111]">
            {filteredBooths.map((booth) => {
              const company = getCompanyForBooth(booth.id);
              return (
                <BoothRow
                  key={booth.id}
                  boothCode={booth.code}
                  name={company?.name ?? booth.label}
                  selected={selectedBoothId === booth.id}
                  onClick={() => handleSelectBooth(booth.id)}
                  bookmarked={isBookmarked(booth.id)}
                  onToggleBookmark={() => toggleBookmark(booth.id)}
                  bookmarkLabel={ui.boothDetail.bookmarkLabel}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Section header with booth count, like the reference list */}
      <div className="mb-2.5 flex justify-between font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
        <span>{ui.venueList.title}</span>
        <span className="text-[#5f5f5f]">{allBooths.length} booths</span>
      </div>

      {zones.map((zone) => {
        const booths = allBooths.filter((b) => b.zoneId === zone.id);
        if (booths.length === 0) return null;
        return (
          <div
            key={zone.id}
            className="mb-2.5 border border-[#2a2a2a] bg-[#111]"
            style={{ borderTop: `3px solid ${zone.color}` }}
          >
            {/* Zone header: name + count */}
            <div className="flex justify-between border-b border-[#2a2a2a] px-3 py-2 font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
              <span>Zone {zoneCode(zone.id)}</span>
              <span>{booths.length}</span>
            </div>
            <div>
              {booths.map((booth) => {
                const company = getCompanyForBooth(booth.id);
                return (
                  <BoothRow
                    key={booth.id}
                    boothCode={booth.code}
                    name={company?.name ?? booth.label}
                    selected={selectedBoothId === booth.id}
                    onClick={() => handleSelectBooth(booth.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
