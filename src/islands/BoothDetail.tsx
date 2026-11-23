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
  // Subscribe to the array itself: isBookmarked() reads it at call time, so
  // without this selector the button renders once and never flips.
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
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
  const saved = bookmarkedIds.includes(selectedBoothId);

  return (
    <div className="space-y-4">
      {/* Title block owns the FULL column width — side-by-side action
          buttons squeezed the name into 3-line wraps. */}
      <div>
        <div className="sidebar-section-title !mt-0">
          {ui.boothDetail.selectedLabel}
        </div>
        <h2 className="font-heading text-[22px] font-extrabold leading-[1.1] tracking-[-0.4px] text-white">
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
            <span className="flex items-center gap-1 bg-[var(--accent-pink)] px-2 py-0.5 text-xs font-bold text-white">
              {new Date(session.start).toLocaleTimeString(event.locale, {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </span>
          )}
          {trackInfo && (
            <span className="bg-chip px-2 py-0.5 text-xs font-medium text-white">
              {trackInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Action row: three equal, full-width targets below the title.
          Idle = flat surface; saved = pink tint + filled glyph. */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => toggleBookmark(selectedBoothId)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold transition-[transform,colors] active:scale-[0.98] ${
            saved
              ? 'bg-(--accent-pink)/20 text-[var(--accent-pink)]'
              : 'bg-card text-ink-muted hover:bg-card-hover hover:text-white'
          }`}
          aria-label={ui.boothDetail.bookmarkLabel}
          aria-pressed={saved}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          {ui.boothDetail.bookmarkLabel}
        </button>
        <button
          type="button"
          onClick={() => share(selectedBoothId)}
          className="flex items-center justify-center gap-1.5 bg-card px-3 py-2.5 text-[12px] font-semibold text-ink-muted transition-[transform,colors] hover:bg-card-hover hover:text-white active:scale-[0.98]"
          aria-label={ui.boothDetail.shareLabel}
        >
          <Share2 size={16} />
          {ui.boothDetail.shareLabel}
        </button>
        <button
          type="button"
          onClick={() => selectBooth(null)}
          className="flex items-center justify-center gap-1.5 bg-card px-3 py-2.5 text-[12px] font-semibold text-ink-muted transition-[transform,colors] hover:bg-card-hover hover:text-white active:scale-[0.98]"
          aria-label={ui.boothDetail.closeLabel}
        >
          <X size={16} />
          {ui.boothDetail.closeLabel}
        </button>
      </div>

      {company?.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {company.tags.map((tag) => (
            <span
              key={tag}
              className="bg-chip px-2 py-0.5 text-[11px] text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* CTA pair collapses to a column only in genuinely narrow regions
          (container query, §1) — desktop sidebar and mobile sheet both fit
          two across. */}
      <div className="grid grid-cols-1 gap-2 @[18rem]:grid-cols-2">
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
        <div className="bg-card px-3 py-1.5 text-xs font-medium text-[#d4d4d8]">
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
                className="bg-card px-3 py-2.5 text-sm text-white transition-colors hover:bg-card-hover"
              >
                {role.title}
                <div className="text-xs text-[#d4d4d8]">{role.type}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
