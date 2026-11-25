import { useState } from 'react';
import { ArrowUpRight, Star, X } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { facilities, registration } from '../../lib/data';

/**
 * Facility detail — one card: cover, title, then the bento explanation and
 * tip inside the same surface (no nested cards), all with padding.
 */
export default function FacilityDetail() {
  const facilityId = useMapStore((s) => s.selectedFacilityId);
  const selectFacility = useMapStore((s) => s.selectFacility);
  const [starred, setStarred] = useState(false);

  if (!facilityId) return null;
  const facility = facilities[facilityId];
  if (!facility) return null;

  return (
    <section className="border border-line bg-[#141416]">
      <div
        className="relative h-14 w-full overflow-hidden border-b border-line"
        style={{
          background: `linear-gradient(135deg, ${facility.accent}33 0%, #141416 70%)`,
        }}
      >
        <span
          className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-black md:text-[10px]"
          style={{ backgroundColor: facility.accent }}
        >
          {facility.kind}
        </span>
        <div className="absolute right-1 top-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStarred((v) => !v)}
            aria-label={starred ? 'Saved' : 'Save'}
            aria-pressed={starred}
            title={starred ? 'Saved' : 'Save'}
            className={`flex size-11 items-center justify-center transition-[color,transform] active:scale-95 md:size-8 ${
              starred ? 'text-[var(--accent-pink)]' : 'text-white/60 hover:text-white'
            }`}
          >
            <Star
              size={20}
              fill={starred ? 'currentColor' : 'none'}
              className="md:h-[18px] md:w-[18px]"
            />
          </button>
          <button
            type="button"
            onClick={() => selectFacility(null)}
            aria-label="Close"
            title="Close"
            className="flex size-11 items-center justify-center text-white transition-colors hover:text-white/70 active:scale-95 md:size-8"
          >
            <X size={24} className="md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="inline-block bg-[var(--accent-pink)] px-2 py-0.5 font-heading text-[0.6875rem] font-bold leading-tight text-white md:text-[10px]">
          Facility
        </div>
        <h2 className="mt-1.5 font-heading text-[1.375rem] font-extrabold leading-[1.1] tracking-[-0.4px] text-white md:text-[20px]">
          {facility.title}
        </h2>
        <p className="mt-1.5 text-[0.875rem] leading-snug text-[#d4d4d8] md:text-[12px]">{facility.summary}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-0 border-t border-line @[17rem]:grid-cols-2 @[17rem]:divide-x @[17rem]:divide-[#2a2a2a]">
        {facility.items.map((item, i) => (
          <div
            key={item.heading}
            className={`p-3 ${i > 0 ? 'border-t border-[#2a2a2a] @[17rem]:border-t-0' : ''}`}
          >
            <div className="font-heading text-[0.875rem] font-semibold leading-tight text-white md:text-[12px]">
              {item.heading}
            </div>
            <p className="mt-1 text-[0.8125rem] leading-snug text-[#d4d4d8] md:text-[11.5px]">{item.body}</p>
          </div>
        ))}
      </div>

      {facilityId === 'registration' && (
        <div className="grid gap-1.5 border-t border-line p-3 @[17rem]:grid-cols-2">
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

      {facility.tip && (
        <div className="border-t border-line px-3 py-2 text-[0.8125rem] leading-snug text-[#8f8f8f] md:text-[11px]">
          {facility.tip}
        </div>
      )}
    </section>
  );
}
