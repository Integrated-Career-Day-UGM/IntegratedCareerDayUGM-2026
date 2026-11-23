import { Bookmark, Share2 } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useShareBooth } from '../hooks/useShareBooth';
import { track } from '../lib/analytics';
import type { Booth, Company } from '../types/map';
import { getBooth, getCompanyForBooth, getZonesByArea, getSessionsByArea, getTrack, event, ui } from '../lib/data';

export default function BookmarkList() {
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  const isBookmarked = useMapStore((s) => s.isBookmarked);
  const { share, feedback: shareFeedback } = useShareBooth();

  const handleSelectBooth = (boothId: string) => {
    track('item.click', { boothId, context: 'saved-list' });
    selectBooth(boothId);
  };

  const items = bookmarkedIds
    .map((id): { id: string; booth: Booth; company: Company | undefined } | null => {
      const booth = getBooth(id);
      if (!booth) return null;
      return { id, booth, company: getCompanyForBooth(id) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="space-y-3">
      <div className="sidebar-section-title">{ui.saved.listTitle}</div>

      {items.length === 0 && (
        <div className="bg-card px-3 py-4 text-sm text-ink-muted">
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
              className="relative bg-card p-3 transition-colors hover:bg-card-hover"
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
                      <span className="bg-[var(--accent-pink)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {new Date(session.start).toLocaleTimeString(event.locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    )}
                    {track && (
                      <span className="bg-chip px-1.5 py-0.5 text-[10px] text-white">
                        {track.label}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => share(id)}
                  className="shrink-0 p-1.5 text-ink-muted transition-[transform,colors] hover:text-white active:scale-95"
                  aria-label={ui.boothDetail.shareLabel}
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(id)}
                  className="shrink-0 text-[var(--accent-pink)] transition-[transform,colors] active:scale-95"
                  aria-label={ui.boothDetail.bookmarkLabel}
                >
                  <Bookmark size={18} fill={isBookmarked(id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              {shareFeedback && (
                <div className="mt-1.5 text-xs text-[#d4d4d8]">{shareFeedback}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
