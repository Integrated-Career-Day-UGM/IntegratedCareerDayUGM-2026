import { Bookmark } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import ShareBoothButton from '../../components/map/ShareBoothButton';
import { track } from '../../lib/analytics';
import type { Booth, Company } from '../../types/map';
import { getBooth, getCompanyForBooth, getZonesByArea, getSessionsByArea, getTrack, event, ui } from '../../lib/data';

export default function BookmarkList() {
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  const isBookmarked = useMapStore((s) => s.isBookmarked);

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
    <div>
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">{ui.saved.listTitle}</div>

      {items.length === 0 && (
        <div className="panel-list px-3 py-4 text-[13px] text-ink-dim">
          {ui.saved.empty}
        </div>
      )}

      <div className="panel-list reveal-items divide-y divide-[#2a2a2a]">
        {items.map(({ id, booth, company }) => {
          const zone = getZonesByArea(booth.areaId).find((z) => z.id === booth.zoneId);
          const session = getSessionsByArea(booth.areaId).find((s) => s.companyId === booth.companyId);
          const track = session ? getTrack(session.trackId) : null;

          return (
            <div
              key={id}
              className="relative px-3 py-2.5 transition-colors hover:bg-[#181818]"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectBooth(id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-[13px] font-semibold text-white">
                    {company?.name ?? booth.label}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="px-1.5 py-0.5 text-[11px] font-bold text-white"
                      style={{ backgroundColor: zone?.color ?? '#27272a' }}
                    >
                      {booth.code}
                    </span>
                    {session && (
                      <span className="bg-[var(--accent-pink)] px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {new Date(session.start).toLocaleTimeString(event.locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    )}
                    {track && (
                      <span className="bg-[#1f1f23] px-1.5 py-0.5 text-[11px] text-[#d4d4d8]">
                        {track.label}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-0.5 self-start">
                  <ShareBoothButton
                    boothId={id}
                    iconSize={16}
                    className="size-7 text-ink-muted hover:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleBookmark(id)}
                    className="flex size-7 items-center justify-center text-[var(--accent-pink)] transition-[transform,colors] active:scale-95"
                    aria-label={ui.boothDetail.bookmarkLabel}
                  >
                    <Bookmark size={18} fill={isBookmarked(id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
