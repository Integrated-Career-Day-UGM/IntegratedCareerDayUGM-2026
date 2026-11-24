import { ArrowUpRight, Bookmark, Share2, X } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useShareBooth } from '../../hooks/map/useShareBooth';
import { useFluidHover } from '../../hooks/use-fluid-hover';
import { FluidHoverHighlight } from '../../components/ui/fluid-hover-highlight';
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

function CtaBar({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="cta-bar group relative flex h-9 w-full items-center gap-2 overflow-hidden bg-white pl-2 pr-3 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
      />
      <ArrowUpRight
        size={14}
        strokeWidth={2.4}
        className="cta-content relative z-10 shrink-0"
      />
      <span className="cta-content relative z-10 font-heading text-[13px] leading-none font-bold tracking-[-0.1px]">
        {label}
      </span>
    </a>
  );
}

export default function BoothDetail() {
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const toggleBookmark = useMapStore((s) => s.toggleBookmark);
  const bookmarkedIds = useMapStore((s) => s.bookmarkedIds);
  const { share, feedback: shareFeedback } = useShareBooth();

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

  // Openings are grouped by contract type; one fluid hover glides across the
  // whole list like the search results.
  const openingsGroups = useMemo(() => {
    const groups: { type: string; roles: { title: string; type: string }[] }[] = [];
    for (const role of company?.openings ?? []) {
      let group = groups.find((g) => g.type === role.type);
      if (!group) {
        group = { type: role.type, roles: [] };
        groups.push(group);
      }
      group.roles.push(role);
    }
    return groups;
  }, [company]);
  const openingsRef = useRef<HTMLDivElement>(null);
  const openingsHover = useFluidHover(openingsRef);

  if (!selectedBoothId) return null;
  const saved = bookmarkedIds.includes(selectedBoothId);

  let flatIndex = 0;

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
          <button
            type="button"
            onClick={() => share(selectedBoothId)}
            className="flex size-8 items-center justify-center text-white/60 transition-colors hover:text-white active:scale-95"
            aria-label={ui.boothDetail.shareLabel}
            title={ui.boothDetail.shareLabel}
          >
            <Share2 size={18} />
          </button>
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

      {shareFeedback && (
        <div className="border-t border-line px-3 py-2 text-[12px] text-[#d4d4d8]">
          {shareFeedback}
        </div>
      )}

      {company?.openings.length ? (
        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="section-label">{ui.boothDetail.opportunitiesLabel}</div>
            <span className="font-heading text-[11px] font-semibold text-ink-dim">
              {company.openings.length}
            </span>
          </div>

          <div ref={openingsRef} className="relative" {...openingsHover.handlers}>
            <FluidHoverHighlight hover={openingsHover} className="bg-[#1f1f23]" />
            {openingsGroups.map((group) => (
              <div key={group.type} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
                    {group.type}
                  </span>
                  <span className="text-[10px] tabular-nums text-[#8f8f8f]">
                    {group.roles.length}
                  </span>
                </div>
                {group.roles.map((role) => {
                  const index = flatIndex++;
                  return (
                    <div
                      key={`${group.type}-${role.title}-${index}`}
                      ref={(el) => openingsHover.registerItem(index, el)}
                      className="relative flex items-center justify-between gap-3 px-2 py-2"
                    >
                      <span className="text-[13px] font-medium leading-snug text-white">
                        {role.title}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-[#8f8f8f]">
                        {role.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
