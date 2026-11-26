import { Bookmark, X } from 'lucide-react';
import { useMemo } from 'react';
import { useMapStore } from '../../stores/mapStore';
import ShareBoothButton from '../../components/map/ShareBoothButton';
import CtaBar from '../../components/map/CtaBar';
import OpeningsList from '../../components/map/OpeningsList';
import CompanySessions from '../../components/map/CompanySessions';
import CompanyProfileBlocks, {
  CompanyCategoryChips,
} from '../../components/map/CompanyProfileBlocks';
import CompanyPosterTeaser from '../../components/map/CompanyPosterTeaser';
import { track } from '../../lib/analytics';
import {
  getBooth,
  getCompanyForBooth,
  getZonesByArea,
  getSessionsByArea,
  getTrack,
  event,
  ui,
} from '../../lib/data';

export default function BoothDetail() {
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);

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
    <section className="border border-line bg-[#141416]">
      {/* Cover + inline actions. Borders removed; icons scaled up; the X is
          white so the exit is the clearest control. */}
      <div
        className="relative h-14 w-full overflow-hidden border-b border-line"
        style={{
          background: `linear-gradient(135deg, ${zone?.color ?? '#27272a'}33 0%, #141416 70%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-16">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="" className="max-h-8 w-auto object-contain" />
          ) : null}
        </div>

        <span
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-white md:text-[10px]"
          style={{ backgroundColor: zone?.color ?? '#27272a' }}
        >
          {booth?.code}
        </span>

        <div className="absolute right-1 top-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleBookmark(selectedBoothId)}
            className={`flex size-11 items-center justify-center transition-[color,transform] active:scale-95 md:size-8 ${
              saved
                ? 'text-[var(--accent-pink)]'
                : 'text-white/60 hover:text-white'
            }`}
            aria-label={ui.boothDetail.bookmarkLabel}
            aria-pressed={saved}
            title={ui.boothDetail.bookmarkLabel}
          >
            <Bookmark
              size={22}
              fill={saved ? 'currentColor' : 'none'}
              className="md:h-[18px] md:w-[18px]"
            />
          </button>
          <ShareBoothButton boothId={selectedBoothId} iconSize={22} />
          <button
            type="button"
            onClick={() => selectBooth(null)}
            className="flex size-11 items-center justify-center text-white transition-colors hover:text-white/70 active:scale-95 md:size-8"
            aria-label={ui.boothDetail.closeLabel}
            title={ui.boothDetail.closeLabel}
          >
            <X size={24} className="md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      <div className="px-3 pt-3">
        {/* Ribbon-style label (Jelajahi Denah treatment, not rotated) */}
        <div className="inline-block bg-[var(--accent-pink)] px-2 py-0.5 font-heading text-[0.6875rem] font-bold leading-tight text-white md:text-[10px]">
          {ui.boothDetail.selectedLabel}
        </div>
        <h2 className="mt-1.5 font-heading text-[1.375rem] font-extrabold leading-[1.1] tracking-[-0.4px] text-white md:text-[20px]">
          {company?.name ?? booth?.label}
        </h2>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
        {session && (
          <span className="bg-[var(--accent-pink)] px-1.5 py-0.5 text-[0.75rem] font-bold text-white md:text-[11px]">
            {new Date(session.start).toLocaleTimeString(event.locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            WIB
          </span>
        )}
        {trackInfo && (
          <span className="bg-[#1f1f23] px-1.5 py-0.5 text-[0.75rem] font-medium text-[#d4d4d8] md:text-[11px]">
            {trackInfo.label}
          </span>
        )}
      </div>

      <CompanyCategoryChips profile={company?.profile} />

      {!company?.profile?.categories?.length && company?.tags.length ? (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
          {company.tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="bg-[#1f1f23] px-1.5 py-0.5 text-[0.75rem] text-[#d4d4d8] md:text-[11px]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {company?.description && (
        <p className="border-t border-line px-3 py-2 text-[0.8125rem] leading-snug text-[#d4d4d8] md:text-[11.5px]">
          {company.description}
        </p>
      )}

      <CompanyProfileBlocks profile={company?.profile} />
      {company && <CompanyPosterTeaser company={company} />}

      {/* Everything below stays inside the one card, with its own padding. */}
      {(company?.websiteUrl || company?.programUrl) && (
        <div className="space-y-2 border-t border-line p-3">
          {company?.websiteUrl && (
            <CtaBar
              href={company.websiteUrl}
              label={ui.boothDetail.websiteCta}
              onClick={() =>
                track('cta.click', {
                  boothId: selectedBoothId,
                  type: 'website',
                  url: company.websiteUrl,
                })
              }
            />
          )}
          {company?.programUrl && !company.profile?.programLinks?.length && (
            <CtaBar
              href={company.programUrl}
              label={ui.boothDetail.programCta}
              onClick={() =>
                track('cta.click', {
                  boothId: selectedBoothId,
                  type: 'program',
                  url: company.programUrl,
                })
              }
            />
          )}
        </div>
      )}

      {/* What the company is doing beyond this booth — stage talks, track
          sessions and walk-in bookings — then the openings, the same order
          the walk-in detail card uses. */}
      {company && <OpeningsList openings={company.openings} />}
      <CompanySessions companyId={booth?.companyId ?? null} />
    </section>
  );
}
