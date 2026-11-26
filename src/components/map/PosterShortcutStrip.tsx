import { useRef, useState } from 'react';
import { booths, companies } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import PosterGalleryModal from './PosterGalleryModal';
import type { Company } from '../../types/map';

const posterCompanies = companies.filter(
  (company) => (company.posters?.length ?? 0) > 0,
);

/**
 * Company job posters, under the info bento. Mouse drag and touch both pan
 * the strip; no scrollbar. Cards are sharp on desktop, softly rounded on
 * mobile (the sheet's own radius language).
 */
export default function PosterShortcutStrip() {
  const [gallery, setGallery] = useState<Company | null>(null);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  if (posterCompanies.length === 0) return null;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    drag.current = {
      active: true,
      startX: event.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    event.currentTarget.scrollLeft = drag.current.startLeft - dx;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Never captured (touch / synthetic).
    }
  };

  return (
    <section className="select-none">
      <div className="mb-2 flex items-end justify-between">
        <div className="font-heading text-[1.0625rem] font-bold leading-none text-white md:text-[15px]">
          Company posters
        </div>
        <div className="text-[0.6875rem] text-[#8f8f8f] md:text-[9px]">
          {posterCompanies.length} companies
        </div>
      </div>

      <div
        className="flex cursor-grab snap-x gap-2 overflow-x-auto overscroll-x-contain pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onClickCapture={(event) => {
          if (!drag.current.moved) return;
          drag.current.moved = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {posterCompanies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => setGallery(company)}
            className="group w-[calc((100%-1rem)/3)] shrink-0 snap-start overflow-hidden rounded-[6px] border border-line bg-[#141416] text-left transition-colors hover:border-[#4a4a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416] md:w-[92px] md:rounded-none"
          >
            <span className="block aspect-[3/4] overflow-hidden border-b border-line bg-[#0a0a0c]">
              <img
                src={company.posters?.[0]?.thumbUrl}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </span>
            <span className="block truncate px-1.5 py-1 text-[0.6875rem] font-semibold text-white">
              {company.shortName || company.name}
            </span>
          </button>
        ))}
      </div>

      {gallery && (
        <PosterGalleryModal
          items={gallery.posters ?? []}
          company={gallery}
          index={0}
          onClose={() => setGallery(null)}
          onOpenBooth={() => {
            const booth = booths.find((b) => b.companyId === gallery.id);
            if (booth) selectBooth(booth.id);
            setGallery(null);
          }}
        />
      )}
    </section>
  );
}
