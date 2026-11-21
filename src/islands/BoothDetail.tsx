import { ArrowUpRight, Bookmark, Share2, X } from 'lucide-react';
import { useMemo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useShareBooth } from '../hooks/useShareBooth';
import { track } from '../lib/analytics';
import { getBooth, getCompanyForBooth, getZonesByArea, getSessionsByArea, getTrack, event, ui } from '../lib/data';

export default function BoothDetail() {
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  const isBookmarked = useMapStore((s) => s.isBookmarked);
  const { share, feedback: shareFeedback } = useShareBooth();

  // Hooks before the early return. Lookups are linear scans over the JSON
  // arrays, so memoizing them keeps the render cheap without re-scanning on
  // unrelated store churn (hover, moveend).
  const booth = useMemo(
    () => (selectedBoothId ? getBooth(selectedBoothId) : undefined),
    [selectedBoothId],
  );
  const company = useMemo(
    () => (selectedBoothId ? getCompanyForBooth(selectedBoothId) : undefined),
    [selectedBoothId],
  );
  const zone = useMemo(
    () =>
      booth
        ? getZonesByArea(booth.areaId).find((z) => z.id === booth.zoneId)
        : undefined,
    [booth],
  );
  const session = useMemo(
    () =>
      booth
        ? getSessionsByArea(booth.areaId).find((s) => s.companyId === booth.companyId)
        : undefined,
    [booth],
  );
  const trackInfo = useMemo(
    () => (session ? getTrack(session.trackId) : null),
    [session],
  );

  if (!selectedBoothId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="sidebar-section-title !mt-0">
            {ui.boothDetail.selectedLabel}
          </div>
          <h2 className="font-heading text-[19px] font-extrabold leading-tight tracking-[-0.4px] text-white">
            {company?.name ?? booth?.label}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: zone?.color ?? '#27272a' }}
            >
              {booth?.code}
            </span>
            {session && (
              <span className="flex items-center gap-1 bg-[#ff2d6f] px-2 py-0.5 text-xs font-bold text-white">
                {new Date(session.start).toLocaleTimeString(event.locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </span>
            )}
            {trackInfo && (
              <span className="bg-[#575757] px-2 py-0.5 text-xs font-medium text-white">
                {trackInfo.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => toggleBookmark(selectedBoothId)}
            className={`p-2 transition-[transform,colors] active:scale-95 ${
              isBookmarked(selectedBoothId)
                ? 'bg-[#ff2d6f]/20 text-[#ff2d6f]'
                : 'bg-[#4a4a4a] text-[#9b9b9b] hover:bg-[#555]'
            }`}
            aria-label={ui.boothDetail.bookmarkLabel}
          >
            <Bookmark size={18} fill={isBookmarked(selectedBoothId) ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => share(selectedBoothId)}
            className="bg-[#4a4a4a] p-2 text-[#9b9b9b] transition-[transform,colors] hover:bg-[#555] hover:text-white active:scale-95"
            aria-label={ui.boothDetail.shareLabel}
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => selectBooth(null)}
            className="bg-[#4a4a4a] p-2 text-[#9b9b9b] transition-[transform,colors] hover:bg-[#555] hover:text-white active:scale-95"
            aria-label={ui.boothDetail.closeLabel}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {company?.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {company.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#575757] px-2 py-0.5 text-[11px] text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {company?.websiteUrl && (
          <a
            href={company.websiteUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track('cta.click', { boothId: selectedBoothId, type: 'website', url: company.websiteUrl })
            }
            className="flex items-center justify-center gap-2 bg-white px-3 py-2 text-sm font-extrabold text-black transition-transform active:scale-[0.98]"
          >
            {ui.boothDetail.websiteCta}
            <ArrowUpRight size={14} />
          </a>
        )}
        {company?.programUrl && (
          <a
            href={company.programUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track('cta.click', { boothId: selectedBoothId, type: 'program', url: company.programUrl })
            }
            className="flex items-center justify-center gap-2 bg-white px-3 py-2 text-sm font-extrabold text-black transition-transform active:scale-[0.98]"
          >
            {ui.boothDetail.programCta}
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>

      {shareFeedback && (
        <div className="bg-[#4a4a4a] px-3 py-1.5 text-xs font-medium text-[#bbb]">
          {shareFeedback}
        </div>
      )}

      {company?.openings.length ? (
        <div className="space-y-2">
          <div className="sidebar-section-title">{ui.boothDetail.opportunitiesLabel}</div>
          <div className="space-y-2">
            {company.openings.map((role, i) => (
              <div
                key={i}
                className="bg-[#4a4a4a] px-3 py-2.5 text-sm text-white transition-colors hover:bg-[#555]"
              >
                {role.title}
                <div className="text-xs text-[#bbb]">{role.type}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
