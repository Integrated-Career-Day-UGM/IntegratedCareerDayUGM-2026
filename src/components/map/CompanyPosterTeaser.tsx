import { useState } from 'react';
import { Images } from 'lucide-react';
import PosterGalleryModal from './PosterGalleryModal';
import { booths } from '../../lib/data';
import { useMapStore } from '../../stores/mapStore';
import type { Company } from '../../types/map';

/** Company detail poster teaser: opens the full gallery for that company. */
export default function CompanyPosterTeaser({ company }: { company: Company }) {
  const [open, setOpen] = useState(false);
  const selectBooth = useMapStore((s) => s.selectBooth);
  const posters = company.posters ?? [];
  if (!posters.length) return null;

  return (
    <section className="border-t border-line p-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[10px] border border-line bg-[#101014] p-2 text-left transition-colors hover:border-[var(--accent-pink)]"
      >
        <img
          src={posters[0].thumbUrl}
          alt=""
          loading="lazy"
          className="h-14 w-20 shrink-0 rounded-[6px] border border-line object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-white">
            <Images size={15} strokeWidth={1.8} />
            Lihat Poster
          </span>
          <span className="mt-0.5 block text-[0.75rem] text-[#8f8f8f]">
            {posters.length} poster{posters.length === 1 ? '' : 's'}
          </span>
        </span>
      </button>

      {open && (
        <PosterGalleryModal
          items={posters}
          company={company}
          index={0}
          onOpenBooth={() => {
            const booth = booths.find((item) => item.companyId === company.id);
            setOpen(false);
            if (booth) selectBooth(booth.id);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

