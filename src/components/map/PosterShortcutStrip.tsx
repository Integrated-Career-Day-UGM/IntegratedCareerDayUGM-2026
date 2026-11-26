import { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { booths, companies } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import PosterGalleryModal from './PosterGalleryModal';
import type { Company } from '../../types/map';

const posterCompanies = companies.filter(
  (company) => (company.posters?.length ?? 0) > 0,
);

/**
 * Horizontal shortcut to company job posters, above the Info bento. The
 * footer link hooks down to the full company directory instead of duplicating
 * the whole grid here.
 */
export default function PosterShortcutStrip() {
  const [gallery, setGallery] = useState<Company | null>(null);
  const selectBooth = useMapStore((s) => s.selectBooth);

  if (posterCompanies.length === 0) return null;

  const scrollToDirectory = () => {
    document
      .getElementById('company-directory')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="mb-3">
      <div className="mb-1.5 flex items-center justify-end">
        <button
          type="button"
          onClick={scrollToDirectory}
          className="inline-flex min-h-9 items-center gap-1.5 bg-white px-3 py-1.5 text-[0.6875rem] font-bold text-black transition-colors hover:bg-white/90"
        >
          Lihat semua
          <ArrowDown size={12} />
        </button>
      </div>

      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posterCompanies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => setGallery(company)}
            className="group w-[calc((100%-1rem)/3)] shrink-0 snap-start overflow-hidden rounded-[6px] border border-line bg-[#141416] text-left transition-colors hover:border-[#4a4a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416] md:w-[92px]"
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
          onOpenBooth={() => {
            const booth = booths.find((item) => item.companyId === gallery.id);
            setGallery(null);
            if (booth) selectBooth(booth.id);
          }}
          onClose={() => setGallery(null)}
        />
      )}
    </section>
  );
}
