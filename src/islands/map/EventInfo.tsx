import {
  MapPin,
  Clock,
  Briefcase,
  CircleHelp,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import {
  careerFairMeta,
  companies,
  event,
  ui,
} from '../../lib/data';
import { surfaceClasses } from '../../lib/surface-classes';
import { cn } from '../../lib/utils/cn';
import RegisterCtas from '../../components/map/RegisterCtas';
import PosterFolder from '../../components/map/PosterFolder';
import SocialLinks from '../../components/map/SocialLinks';
import CompanyBentoGrid from '../../components/map/CompanyBentoGrid';
import PosterShortcutStrip from '../../components/map/PosterShortcutStrip';

const card = cn(
  'flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-line p-3',
  surfaceClasses(3, 3),
);
const icon = 'text-[#8f8f8f]';

/**
 * Info tab — a clean 2×2 information block. Poster carousels and Daftar are
 * full-width rows above it on mobile; desktop keeps the folders over the map.
 */
export default function EventInfo() {
  const { venue, hours, whatToBring, help } = ui.info.sections;
  const { overview } = ui.info;
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
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">
        {ui.info.title}
      </div>

      {updatedLabel && (
        <div className="mb-2 flex justify-end">
          <time
            dateTime={updatedAt ?? undefined}
            className="text-[0.6875rem] text-[#71717a] md:text-[0.625rem]"
            title="Lowongan diperbarui"
          >
            Lowongan diperbarui {updatedLabel} WIB
          </time>
        </div>
      )}

      <PosterShortcutStrip />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 md:hidden">
          <RegisterCtas />
        </div>

        {/* 2×2 information block */}
        <section className={card}>
          <MapPin size={14} className={icon} />
          <div className="mt-2 font-heading text-[1.5rem] font-bold leading-[0.85] tracking-[-1.2px] text-white md:text-[1.75rem] md:tracking-[-1.4px]">
            {venue.headline}
          </div>
          {venue.subline && (
            <div className="mt-0.5 text-[0.75rem] font-medium text-[#a1a1aa] md:text-[11px]">
              {venue.subline}
            </div>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="cta-bar group relative mt-auto flex min-h-9 w-full items-center gap-2 overflow-hidden bg-white pl-1.5 pr-2 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
          >
            <span
              aria-hidden="true"
              className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
            />
            <span className="cta-tile cta-content relative z-10 flex size-5 shrink-0 items-center justify-center border border-black/70">
              <ArrowUpRight size={11} strokeWidth={2.4} />
            </span>
            <span className="cta-content relative z-10 truncate text-[0.75rem] font-bold md:text-[10px]">
              {ui.info.mapsCta}
            </span>
          </a>
        </section>

        <section className={card}>
          <Clock size={14} className={icon} />
          <div className="mt-2 font-heading text-[1.125rem] font-bold leading-[1.05] tracking-[-0.2px] text-white md:text-[16px]">
            {hours.headline}
          </div>
          {hours.body && (
            <p className="mt-1.5 text-[0.75rem] leading-snug text-[#8f8f8f] md:text-[10px]">
              {hours.body}
            </p>
          )}
          <div className="mt-auto flex items-baseline gap-1 pt-2">
            <span className="font-heading text-[1.375rem] font-bold leading-none text-white md:text-[18px]">
              {companies.length}
            </span>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f] md:text-[8.5px]">
              {overview.companies}
            </span>
          </div>
          <div className="mt-0.5 text-[0.6875rem] text-[#8f8f8f] md:text-[9px]">
            {event.tracks.length} {overview.tracks} · {event.days.length} {overview.days}
          </div>
        </section>

        <section className={card}>
          <Briefcase size={14} className={icon} />
          <ul className="mt-2 space-y-1.5">
            {(whatToBring.items ?? []).map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-start gap-1.5 text-[0.75rem] leading-snug text-[#d4d4d8] md:text-[10px]"
              >
                <Check size={12} className="mt-0.5 shrink-0 text-[var(--accent-pink)]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <CircleHelp size={14} className={icon} />
          <p className="mt-2 text-[0.75rem] leading-snug text-[#d4d4d8] md:text-[10.5px]">{help.body}</p>
        </section>

        <section className={cn(card, 'col-span-2 flex-row items-center justify-between gap-4')}>
          <div className="min-w-0">
            <div className="font-heading text-[1rem] font-bold leading-tight text-white">
              {ui.social.title}
            </div>
          </div>
          <SocialLinks variant="sheet" />
        </section>

        {/* Poster carousels live under the info bento, not above it. */}
        <div id="icd-poster-carousel" className="col-span-2 mt-1 scroll-mt-4">
          <PosterFolder variant="carousel" />
        </div>

        <div id="company-directory" className="col-span-2 mt-2 scroll-mt-4">
          <div className="section-label mb-2 border-b border-[#232326] pb-2">
            All companies
          </div>
          <CompanyBentoGrid companies={companies} />
        </div>
      </div>
    </div>
  );
}
