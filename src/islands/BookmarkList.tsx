import { Bookmark, Share2 } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useShareBooth } from '../hooks/useShareBooth';
import { track } from '../lib/analytics';
import { getBooth, getCompanyForBooth, getZonesByArea, getSessionsByArea, getTrack, event, ui } from '../lib/data';

export default function BookmarkList() {
  const { bookmarkedIds, selectBooth, toggleBookmark, isBookmarked } = useMapStore();
  const { share, feedback: shareFeedback } = useShareBooth();

  const handleSelectBooth = (boothId: string) => {
    track('item.click', { boothId, context: 'saved-list' });
    selectBooth(boothId);
  };

  const items = bookmarkedIds
    .map((id) => {
      const booth = getBooth(id);
      const company = getCompanyForBooth(id);
      if (!booth) return null;
      return { id, booth, company };
    })
    .filter(Boolean) as { id: string; booth: ReturnType<typeof getBooth>; company: ReturnType<typeof getCompanyForBooth> }[];

  return (
    <div className="space-y-3">
      <div className="sidebar-section-title">{ui.saved.listTitle}</div>

      {items.length === 0 && (
        <div className="bg-[#4a4a4a] px-3 py-4 text-sm text-[#9b9b9b]">
          {ui.saved.empty}
        </div>
      )}

      <div className="space-y-2">
        {items.map(({ id, booth, company }) => {
          const zone = getZonesByArea(booth.areaId).find((z) => z.id === booth.zoneId);
          const session = getSessionsByArea(booth.areaId).find((s) => s.companyId === booth.companyId);
          const track = session ? getTrack(session.trackId) : null;

          return (
            <div
              key={id}
              className="relative bg-[#4a4a4a] p-3 transition-colors hover:bg-[#555]"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectBooth(id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-sm font-semibold text-white">
                    {company?.name ?? booth.label}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: zone?.color ?? '#27272a' }}
                    >
                      {booth.code}
                    </span>
                    {session && (
                      <span className="bg-[#ff2d6f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {new Date(session.start).toLocaleTimeString(event.locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    )}
                    {track && (
                      <span className="bg-[#575757] px-1.5 py-0.5 text-[10px] text-white">
                        {track.label}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => share(id)}
                  className="shrink-0 p-1.5 text-[#9b9b9b] transition-[transform,colors] hover:text-white active:scale-95"
                  aria-label={ui.boothDetail.shareLabel}
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(id)}
                  className="shrink-0 text-[#ff2d6f] transition-[transform,colors] active:scale-95"
                  aria-label={ui.boothDetail.bookmarkLabel}
                >
                  <Bookmark size={18} fill={isBookmarked(id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              {shareFeedback && (
                <div className="mt-1.5 text-xs text-[#bbb]">{shareFeedback}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
