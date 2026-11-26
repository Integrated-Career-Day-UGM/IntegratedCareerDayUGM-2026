import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { booths } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import useHoverCard from '../../hooks/map/useHoverCard';
import PosterGalleryModal from './PosterGalleryModal';
import type { Company } from '../../types/map';

function CompanyCard({
  company,
  onOpen,
}: {
  company: Company;
  onOpen: () => void;
}) {
  const posters = company.posters ?? [];
  const cover = posters[0]?.thumbUrl;
  const clickable = posters.length > 0;
  const { hovered, handlers, style } = useHoverCard('#ff2d6f');
  const active = hovered && clickable;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && onOpen()}
      {...handlers}
      style={style}
      className={`group relative block aspect-[3/4] w-full overflow-hidden bg-[#0e0e11] text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset ${
        clickable ? 'cursor-pointer' : 'cursor-default opacity-60'
      }`}
      aria-label={clickable ? company.name : `${company.name} — poster belum tersedia`}
      title={clickable ? undefined : `${company.name} — poster belum tersedia`}
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-300 ease-out ${
            active ? 'scale-[1.08] brightness-110' : ''
          }`}
        />
      ) : (
        <img
          src="/empty/sparky-empty.svg"
          alt=""
          draggable={false}
          className="absolute inset-0 z-[1] m-auto h-12 w-12 select-none object-contain opacity-70"
        />
      )}

      <span
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background: cover
            ? 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 38%, transparent 66%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
        }}
      />

      <span className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1.5 p-2">
        <span className="min-w-0 flex-1 line-clamp-3 break-words text-balance text-[0.75rem] font-semibold leading-snug text-white">
          {company.name}
        </span>
        {clickable && (
          <ArrowUpRight
            size={12}
            className={`shrink-0 text-white/70 transition-transform duration-200 ${
              active ? '-translate-y-0.5 translate-x-0.5 text-white' : ''
            }`}
          />
        )}
      </span>
    </button>
  );
}

/**
 * All companies as a no-gap bento: one hairline grid, three columns, hard
 * cells (no rounded cards, no glow). Each cell is a poster thumbnail; the
 * whole cell opens that company's gallery.
 */
export default function CompanyBentoGrid({ companies }: { companies: Company[] }) {
  const [gallery, setGallery] = useState<Company | null>(null);
  const selectBooth = useMapStore((s) => s.selectBooth);

  return (
    <div className="overflow-hidden border border-line bg-[#232326]">
      <div className="grid grid-cols-3 gap-px">
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onOpen={() => setGallery(company)}
          />
        ))}
      </div>

      {gallery && (
        <PosterGalleryModal
          items={gallery.posters ?? []}
          company={gallery}
          index={0}
          onOpenBooth={() => {
            const booth = booths.find((item) => item.companyId === gallery.id);
            setGallery(null);
            if (booth) selectBooth(booth.id);
          }}
          onClose={() => setGallery(null)}
        />
      )}
    </div>
  );
}
