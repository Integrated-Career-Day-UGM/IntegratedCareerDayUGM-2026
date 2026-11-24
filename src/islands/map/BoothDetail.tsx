import { Bookmark, Image as ImageIcon, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMapStore } from '../../stores/mapStore';
import ShareBoothButton from '../../components/map/ShareBoothButton';
import CtaBar from '../../components/map/CtaBar';
import OpeningsList from '../../components/map/OpeningsList';
import CompanySessions from '../../components/map/CompanySessions';
import HoverZoomImage from '../../components/map/HoverZoomImage';
import { cn } from '../../lib/utils/cn';
import { surfaceClasses } from '../../lib/surface-classes';
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
  const [posterOpen, setPosterOpen] = useState(false);

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
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: zone?.color ?? '#27272a' }}
        >
          {booth?.code}
        </span>

        <div className="absolute right-1 top-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleBookmark(selectedBoothId)}
            className={`flex size-8 items-center justify-center transition-[color,transform] active:scale-95 ${
              saved
                ? 'text-[var(--accent-pink)]'
                : 'text-white/60 hover:text-white'
            }`}
            aria-label={ui.boothDetail.bookmarkLabel}
            aria-pressed={saved}
            title={ui.boothDetail.bookmarkLabel}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <ShareBoothButton boothId={selectedBoothId} />
          <button
            type="button"
            onClick={() => selectBooth(null)}
            className="flex size-8 items-center justify-center text-white transition-colors hover:text-white/70 active:scale-95"
            aria-label={ui.boothDetail.closeLabel}
            title={ui.boothDetail.closeLabel}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-3 pt-3">
        {/* Ribbon-style label (Jelajahi Denah treatment, not rotated) */}
        <div className="inline-block bg-[var(--accent-pink)] px-2 py-0.5 font-heading text-[10px] font-bold leading-tight text-white">
          {ui.boothDetail.selectedLabel}
        </div>
        <h2 className="mt-1.5 font-heading text-[20px] font-extrabold leading-[1.1] tracking-[-0.4px] text-white">
          {company?.name ?? booth?.label}
        </h2>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
        {session && (
          <span className="bg-[var(--accent-pink)] px-1.5 py-0.5 text-[11px] font-bold text-white">
            {new Date(session.start).toLocaleTimeString(event.locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            WIB
          </span>
        )}
        {trackInfo && (
          <span className="bg-[#1f1f23] px-1.5 py-0.5 text-[11px] font-medium text-[#d4d4d8]">
            {trackInfo.label}
          </span>
        )}
      </div>

      {company?.tags.length ? (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
          {company.tags.map((tag) => (
            <span key={tag} className="bg-[#1f1f23] px-1.5 py-0.5 text-[11px] text-[#d4d4d8]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {company?.description && (
        <p className="border-t border-line px-3 py-2 text-[11px] leading-snug text-[#d4d4d8]">
          {company.description}
        </p>
      )}

      {/* Everything below stays inside the one card, with its own padding. */}
      {(company?.posterUrl || company?.websiteUrl || company?.programUrl) && (
        <div className="space-y-2 border-t border-line p-3">
          {company?.posterUrl && (
            <CtaBar
              icon={ImageIcon}
              label={ui.boothDetail.posterCta}
              onClick={() => {
                setPosterOpen(true);
                track('cta.click', {
                  boothId: selectedBoothId,
                  type: 'poster',
                  url: company.posterUrl,
                });
              }}
            />
          )}
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
          {company?.programUrl && (
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
      <CompanySessions companyId={booth?.companyId ?? null} />
      {company && <OpeningsList openings={company.openings} />}
      {posterOpen && company?.posterUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={() => setPosterOpen(false)}
          >
            <div
              className={cn(
                'flex max-h-[88vh] w-full max-w-[440px] flex-col overflow-hidden rounded-md border border-line md:max-w-[560px]',
                surfaceClasses(4, 4),
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-heading text-[16px] font-bold text-white">
                    {company.name}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[#8f8f8f]">
                    {ui.boothDetail.posterCta}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPosterOpen(false)}
                  aria-label={ui.boothDetail.closeLabel}
                  className="flex size-8 shrink-0 items-center justify-center text-[#8f8f8f] transition-colors hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="h-[70vh] max-h-[78vh] min-h-[280px] bg-[#0c0c0f]">
                <HoverZoomImage
                  src={company.posterUrl}
                  alt={`${company.name} poster`}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
