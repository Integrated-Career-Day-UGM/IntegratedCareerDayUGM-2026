import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { booths, getZone } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import useHoverCard from '../../hooks/map/useHoverCard';
import PosterGalleryModal from './PosterGalleryModal';
import { cn } from '../../lib/utils/cn';
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
  const booth = booths.find((item) => item.companyId === company.id);
  const accent = (booth ? getZone(booth.zoneId)?.color : undefined) ?? '#ff2d6f';
  const { hovered, handlers, style } = useHoverCard(accent);
  const active = hovered && clickable;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && onOpen()}
      {...handlers}
      style={{
        ...style,
        borderColor: active ? 'var(--card-accent)' : undefined,
        boxShadow: active
          ? '0 0 40px -15px color-mix(in srgb, var(--card-accent) 70%, transparent)'
          : undefined,
      }}
      className={cn(
        'group relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] border border-line bg-[#0f0f12] text-left transition-[transform,box-shadow,border-color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416]',
        active ? 'scale-[1.02]' : '',
        clickable ? 'cursor-pointer' : 'cursor-default opacity-70',
      )}
      aria-label={
        clickable
          ? company.name
          : `${company.name} — poster belum tersedia`
      }
      title={
        clickable ? undefined : `${company.name} — poster belum tersedia`
      }
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          className={cn(
            'absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-white/10 transition-transform duration-[400ms] ease-out',
            active ? 'scale-110' : '',
          )}
        />
      ) : (
        <img
          src="/empty/sparky-empty.svg"
          alt=""
          draggable={false}
          className="absolute inset-0 z-[1] m-auto h-16 w-16 select-none object-contain opacity-80"
        />
      )}

      <span
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background: cover
            ? `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 38%, transparent 66%), linear-gradient(to top, ${accent}66 0%, transparent 55%)`
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
        }}
      />

      <span className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 p-2.5">
        <span className="min-w-0 flex-1 line-clamp-3 break-words text-balance text-[0.875rem] font-semibold leading-snug text-white">
          {company.name}
        </span>
        {clickable && (
          <ArrowUpRight
            size={14}
            className={cn(
              'shrink-0 text-white/70 transition-transform duration-200',
              active ? '-translate-y-0.5 translate-x-0.5 text-white' : '',
            )}
          />
        )}
      </span>
    </button>
  );
}

/**
 * All companies as a two-column bento on desktop. Each card is a thumbnail
 * with the company name over it; clicking opens that company's gallery.
 */
export default function CompanyBentoGrid({ companies }: { companies: Company[] }) {
  const [gallery, setGallery] = useState<Company | null>(null);
  const selectBooth = useMapStore((s) => s.selectBooth);

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          onOpen={() => setGallery(company)}
        />
      ))}

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
