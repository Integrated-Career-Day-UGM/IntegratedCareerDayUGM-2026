import { ArrowUpRight } from 'lucide-react';
import { facilities, registration } from '../../lib/data';

/** Large facility bubble for the selected map marker. Registration adds
 *  direct register CTAs; other facilities stay informational. */
export default function FacilityTooltip({ facilityId }: { facilityId: string }) {
  const facility = facilities[facilityId];
  if (!facility) return null;

  return (
    <div className="map-tooltip facility-tooltip pointer-events-auto fixed z-50 w-[250px] border border-line bg-[#141416] md:w-[290px]">
      <div
        className="relative h-12 w-full overflow-hidden border-b border-line md:h-14"
        style={{
          background: `linear-gradient(135deg, ${facility.accent}33 0%, #141416 70%)`,
        }}
      >
        <span
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-black"
          style={{ backgroundColor: facility.accent }}
        >
          {facility.kind}
        </span>
      </div>

      <div className="px-3 pt-2">
        <div className="font-heading text-[20px] font-extrabold leading-[1.05] tracking-[-0.3px] text-white">
          {facility.title}
        </div>
        <p className="mt-1 text-[12px] leading-snug text-[#d4d4d8]">
          {facility.summary}
        </p>
      </div>

      {facilityId === 'registration' && (
        <div className="mt-3 grid gap-1.5 border-t border-line p-3">
          {[registration.ugm, registration.nonUgm].map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="cta-bar group relative flex h-10 items-center justify-between overflow-hidden bg-white px-3 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
            >
              <span
                aria-hidden="true"
                className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
              />
              <span className="cta-content relative z-10 text-[12px] font-bold">
                {item.label}
              </span>
              <ArrowUpRight size={15} strokeWidth={2.4} className="cta-content relative z-10" />
            </a>
          ))}
        </div>
      )}

      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
        <div className="map-tooltip-pointer h-3 w-3 rotate-45 border-b border-r border-line bg-[#141416]" />
      </div>
    </div>
  );
}
