import { MapPin, Clock, Briefcase, CircleHelp, ArrowUpRight, Check } from 'lucide-react';
import { ui } from '../../lib/data';
import RegisterCtas from '../../components/map/RegisterCtas';

/**
 * Help/Info — bento layout: a wide venue tile with the maps action, two
 * square tiles (hours, what-to-bring checklist) and a wide help tile.
 * Copy is split into scannable items instead of one paragraph.
 */
export default function EventInfo() {
  const { venue, hours, whatToBring, help } = ui.info.sections;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ui.info.mapsQuery,
  )}`;

  return (
    <div className="reveal-product">
      {/* Mobile only: the desktop menu floats over the map instead. */}
      <div className="mb-5 md:hidden">
        <RegisterCtas />
      </div>

      <div className="section-label mb-2.5 border-b border-[#232326] pb-2">{ui.info.title}</div>

      <div className="grid grid-cols-1 gap-2 @[17rem]:grid-cols-2">
        {/* Venue — wide tile with the maps action */}
        <section className="panel-list col-span-full p-3">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-[#8f8f8f]" />
            <h3 className="section-label">{venue.heading}</h3>
          </div>
          {venue.headline && (
            <div className="mt-2 font-heading text-[24px] font-bold leading-none text-white">
              {venue.headline}
            </div>
          )}
          <p className="mt-1.5 text-[12px] leading-snug text-[#d4d4d8]">{venue.body}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="cta-bar group relative mt-2.5 flex h-8 w-full items-center gap-2 overflow-hidden bg-white pl-1.5 pr-2 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
          >
            <span
              aria-hidden="true"
              className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
            />
            <span className="cta-tile cta-content relative z-10 flex size-5 shrink-0 items-center justify-center border border-black/70">
              <ArrowUpRight size={11} strokeWidth={2.4} />
            </span>
            <span className="cta-content relative z-10 text-[11px] font-bold">
              {ui.info.mapsCta}
            </span>
          </a>
        </section>

        {/* Hours — the time is the tile's hero fact */}
        <section className="panel-list p-3">
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-[#8f8f8f]" />
            <h3 className="section-label">{hours.heading}</h3>
          </div>
          {hours.headline && (
            <div className="mt-2 font-heading text-[18px] font-bold leading-[1.05] tracking-[-0.2px] text-white">
              {hours.headline}
            </div>
          )}
          <p className="mt-1.5 text-[11.5px] leading-snug text-[#8f8f8f]">{hours.body}</p>
        </section>

        {/* What to bring — checklist tile */}
        <section className="panel-list p-3">
          <div className="flex items-center gap-2">
            <Briefcase size={12} className="text-[#8f8f8f]" />
            <h3 className="section-label">{whatToBring.heading}</h3>
          </div>
          <ul className="mt-2 space-y-1">
            {(whatToBring.items ?? []).map((item) => (
              <li
                key={item}
                className="flex items-start gap-1.5 text-[12px] leading-snug text-[#d4d4d8]"
              >
                <Check size={12} className="mt-0.5 shrink-0 text-[var(--accent-pink)]" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-2 text-[10.5px] text-[#8f8f8f]">{whatToBring.note}</div>
        </section>

        {/* Help — wide tile */}
        <section className="panel-list col-span-full p-3">
          <div className="flex items-center gap-2">
            <CircleHelp size={12} className="text-[#8f8f8f]" />
            <h3 className="section-label">{help.heading}</h3>
          </div>
          <p className="mt-2 text-[12px] leading-snug text-[#d4d4d8]">{help.body}</p>
        </section>
      </div>
    </div>
  );
}
