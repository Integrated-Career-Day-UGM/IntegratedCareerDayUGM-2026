import { useState } from 'react';
import {
  MapPin,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  careerFairMeta,
  companies,
  event,
  schedulePosters,
  ui,
} from '../../lib/data';
import { cn } from '../../lib/utils/cn';
import { useMapStore } from '../../stores/mapStore';
import RegisterCtas from '../../components/map/RegisterCtas';
import PosterGalleryModal from '../../components/map/PosterGalleryModal';
import SocialLinks from '../../components/map/SocialLinks';
import CompanyBentoGrid from '../../components/map/CompanyBentoGrid';

const card =
  'group relative flex h-full min-w-0 flex-col overflow-hidden bg-[#0e0e11] p-3 transition-colors duration-200 hover:bg-[#141418]';

/**
 * Info tab — a clean 2×2 information block. Poster carousels and Daftar are
 * full-width rows above it on mobile; desktop keeps the folders over the map.
 */
export default function EventInfo() {
  const { venue, hours, whatToBring, help } = ui.info.sections;
  const openChangelog = useMapStore((s) => s.openChangelog);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ui.info.mapsQuery,
  )}`;

  const updatedAt = careerFairMeta.updatedAt;
  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat(event.locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: event.timezone,
      }).format(new Date(updatedAt))
    : null;

  return (
    <div className="reveal-product">
      {updatedLabel && (
        <div className="mb-2.5 flex justify-end border-b border-[#232326] pb-2">
          <time
            dateTime={updatedAt ?? undefined}
            className="shrink-0 text-[0.6875rem] text-[#71717a] md:text-[0.625rem]"
            title="Last updated"
          >
            Last updated: {updatedLabel} WIB
          </time>
        </div>
      )}

      <div className="mb-2 md:hidden">
        <RegisterCtas />
      </div>

      {/* Unified INSIGHTS-style grid: hairline gaps, no floating cards. */}
      <div className="mb-4 overflow-hidden border border-line bg-[#232326]">
        <div className="grid grid-cols-2 gap-px">
          <section className={cn(card, 'info-enter')} style={{ animationDelay: '0ms' }}>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.06]"
            >
              <defs>
                <pattern
                  id="info-map-grid"
                  width="16"
                  height="16"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#info-map-grid)" />
            </svg>
            <MapPin
              aria-hidden="true"
              size={120}
              strokeWidth={2}
              className="pointer-events-none absolute -bottom-8 -right-5 text-zinc-500/20"
            />
            <div className="relative z-10 font-heading text-[1.5rem] font-bold leading-[0.85] tracking-[-1.2px] text-white md:text-[1.75rem] md:tracking-[-1.4px]">
              {venue.headline}
            </div>
            {venue.subline && (
              <div className="relative z-10 mt-0.5 text-[0.75rem] font-medium text-[#a1a1aa] md:text-[11px]">
                {venue.subline}
              </div>
            )}
            <div className="relative z-10 mt-auto border-t border-line pt-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="group/cta inline-flex items-center gap-1.5 border border-line bg-[#1b1b1f] px-2.5 py-1 text-xs font-medium text-white transition-[border-color,background-color] duration-200 hover:border-[#5a5a63] hover:bg-[#232327] active:scale-[0.98]"
              >
                {ui.info.mapsCta}
                <ArrowUpRight
                  size={12}
                  strokeWidth={2.2}
                  className="transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:transform-none"
                />
              </a>
            </div>
          </section>

          <section className={cn(card, 'info-enter')} style={{ animationDelay: '60ms' }}>
            <Clock
              aria-hidden="true"
              size={120}
              strokeWidth={2}
              className="pointer-events-none absolute -bottom-8 -right-5 text-zinc-500/20"
            />
            <div className="relative z-10 font-heading text-[1.125rem] font-bold leading-[1.05] tracking-[-0.2px] text-white md:text-[16px]">
              {hours.headline}
            </div>
            {hours.body && (
              <p className="relative z-10 mt-1.5 text-[0.75rem] leading-snug text-[#8f8f8f] md:text-[10px]">
                {hours.body}
              </p>
            )}
            <div className="relative z-10 mt-auto border-t border-line pt-2">
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="group/cta inline-flex items-center gap-1.5 border border-line bg-[#1b1b1f] px-2.5 py-1 text-xs font-medium text-white transition-[border-color,background-color] duration-200 hover:border-[#5a5a63] hover:bg-[#232327] active:scale-[0.98]"
              >
                Lihat Jadwal
                <ArrowUpRight
                  size={12}
                  strokeWidth={2.2}
                  className="transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:transform-none"
                />
              </button>
            </div>
          </section>

          <section className={cn(card, 'info-enter')} style={{ animationDelay: '120ms' }}>
            {/* Rotated document stack, low-contrast, bottom-left. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-8 -left-6 h-28 w-28 opacity-40"
            >
              <span className="absolute bottom-0 left-0 h-16 w-11 rotate-45 border border-[#2a2a2e] bg-[#161619]" />
              <span className="absolute bottom-2 left-3 h-16 w-11 rotate-45 border border-[#2a2a2e] bg-[#131316]" />
              <span className="absolute bottom-4 left-6 h-16 w-11 rotate-45 border border-[#2a2a2e] bg-[#0f0f12]" />
            </div>
            <ul className="relative z-10 divide-y divide-[#2a2a2a]">
              {(whatToBring.items ?? []).map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="py-1.5 font-heading text-[0.8125rem] font-bold leading-snug text-[#d4d4d8] transition-colors duration-200 hover:text-white md:text-[11px]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className={cn(card, 'info-enter')} style={{ animationDelay: '180ms' }}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 right-2 select-none font-heading text-[120px] font-bold leading-none text-transparent"
              style={{ WebkitTextStroke: '3px rgba(255,255,255,0.14)' }}
            >
              ?
            </span>
            <p className="relative z-10 text-[0.75rem] leading-snug text-[#d4d4d8] md:text-[10.5px]">
              {help.body}
            </p>
          </section>

          <section
            className={cn(card, 'info-enter col-span-2 flex-row items-center justify-between gap-4')}
            style={{ animationDelay: '240ms' }}
          >
            <div className="min-w-0 font-heading text-[1rem] font-bold leading-tight text-white">
              {ui.social.title}
            </div>
            <div className="border-l border-line pl-3">
              <SocialLinks variant="sheet" />
            </div>
          </section>
        </div>
      </div>

      <div id="company-directory" className="mt-4 scroll-mt-4">
        <div className="section-label mb-3 border-b border-[#232326] pb-2">
          Posters
        </div>
        <CompanyBentoGrid companies={companies} />
      </div>

      {/* Changelog entry: bottom of the Information tab on every breakpoint. */}
      <button
        type="button"
        onClick={openChangelog}
        className="mt-4 mb-2 block text-[0.75rem] font-semibold text-[#8f8f8f] underline underline-offset-4 transition-colors hover:text-white"
      >
        Changelog
      </button>

      {scheduleOpen && (
        <PosterGalleryModal
          items={schedulePosters}
          heading=""
          index={0}
          portrait
          showDownload={false}
          onClose={() => setScheduleOpen(false)}
        />
      )}
    </div>
  );
}
