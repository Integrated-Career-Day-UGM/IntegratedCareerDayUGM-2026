import {
  MapPin,
  Clock,
  Briefcase,
  CircleHelp,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { useMemo } from 'react';
import { useMapStore } from '../../stores/mapStore';
import {
  companies,
  event,
  ui,
} from '../../lib/data';
import { getCompanyPosterItems } from '../../lib/map/company-posters';
import { surfaceClasses } from '../../lib/surface-classes';
import { cn } from '../../lib/utils/cn';
import RegisterCtas from '../../components/map/RegisterCtas';
import PosterFolder from '../../components/map/PosterFolder';
import SocialLinks from '../../components/map/SocialLinks';

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
  const selectedDayId = useMapStore((s) => s.selectedDayId);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ui.info.mapsQuery,
  )}`;

  const day = event.days.find((entry) => entry.id === selectedDayId);
  const dayLabel = day
    ? new Date(`${day.date}T00:00:00Z`).toLocaleDateString(event.locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
    : '';

  const companyPosterItems = useMemo(
    () => getCompanyPosterItems(selectedDayId),
    [selectedDayId],
  );

  return (
    <div className="reveal-product">
      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">
        {ui.info.title}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 md:hidden">
          <RegisterCtas />
        </div>

        {/* 2×2 information block */}
        <section className={card}>
          <MapPin size={12} className={icon} />
          <div className="mt-2 font-heading text-[38px] font-bold leading-[0.8] tracking-[-2px] text-white">
            {venue.headline}
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="cta-bar group relative mt-auto flex h-8 w-full items-center gap-2 overflow-hidden bg-white pl-1.5 pr-2 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
          >
            <span
              aria-hidden="true"
              className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
            />
            <span className="cta-tile cta-content relative z-10 flex size-5 shrink-0 items-center justify-center border border-black/70">
              <ArrowUpRight size={11} strokeWidth={2.4} />
            </span>
            <span className="cta-content relative z-10 truncate text-[10px] font-bold">
              {ui.info.mapsCta}
            </span>
          </a>
        </section>

        <section className={card}>
          <Clock size={12} className={icon} />
          <div className="mt-2 font-heading text-[16px] font-bold leading-[1.05] tracking-[-0.2px] text-white">
            {hours.headline}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-[#8f8f8f]">{hours.body}</p>
          <div className="mt-auto flex items-baseline gap-1 pt-2">
            <span className="font-heading text-[18px] font-bold leading-none text-white">
              {companies.length}
            </span>
            <span className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[#8f8f8f]">
              {overview.companies}
            </span>
          </div>
          <div className="mt-0.5 text-[9px] text-[#8f8f8f]">
            {event.tracks.length} {overview.tracks} · {event.days.length} {overview.days}
          </div>
        </section>

        <section className={card}>
          <Briefcase size={12} className={icon} />
          <ul className="mt-2 space-y-1">
            {(whatToBring.items ?? []).map((item) => (
              <li
                key={item}
                className="flex items-start gap-1.5 text-[10px] leading-snug text-[#d4d4d8]"
              >
                <Check size={9} className="mt-0.5 shrink-0 text-[var(--accent-pink)]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <CircleHelp size={12} className={icon} />
          <p className="mt-2 text-[10.5px] leading-snug text-[#d4d4d8]">{help.body}</p>
        </section>

        <section className={cn(card, 'col-span-2 flex-row items-center justify-between gap-4')}>
          <div className="min-w-0">
            <div className="section-label">{ui.social.title}</div>
            <p className="mt-1 truncate text-[10px] text-[#8f8f8f]">
              {ui.social.instagram.handle} · {ui.social.whatsapp.handle}
            </p>
          </div>
          <SocialLinks variant="sheet" />
        </section>

        {/* Poster carousels live under the info bento, not above it. */}
        <div id="icd-poster-carousel" className="col-span-2 mt-1 scroll-mt-4">
          <PosterFolder variant="carousel" />
        </div>

        <div id="company-poster-carousel" className="col-span-2 mt-1 scroll-mt-4">
          <div className="mb-1 flex items-end justify-between">
            <div className="font-heading text-[15px] font-bold leading-none text-white">
              {ui.posters.companyTitle}
            </div>
            <div className="text-[9px] text-[#8f8f8f]">{dayLabel}</div>
          </div>
          <PosterFolder variant="carousel" items={companyPosterItems} hideTitle />
        </div>
      </div>
    </div>
  );
}
