import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import HoverZoomImage from './HoverZoomImage';
import { surfaceClasses } from '../../lib/surface-classes';
import { cn } from '../../lib/utils/cn';
import type { PosterInfo } from '../../types/map';

export type PosterModalProps = {
  poster: PosterInfo | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  index?: number;
  total?: number;
  closeLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  downloadLabel?: string;
};

const posterEmptyLabel = 'Poster belum tersedia';

/**
 * One poster lightbox for the folder gimmick, company detail and opening
 * posters. The poster files are local public assets, so Download works
 * without CORS or expiring CDN URLs.
 */
export default function PosterModal({
  poster,
  onClose,
  onPrevious,
  onNext,
  index,
  total,
  closeLabel = 'Close poster',
  previousLabel = 'Previous poster',
  nextLabel = 'Next poster',
  downloadLabel = 'Download poster',
}: PosterModalProps) {
  useEffect(() => {
    if (!poster) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious?.();
      if (event.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [poster, onClose, onPrevious, onNext]);

  if (!poster) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={poster.title}
        data-poster-modal=""
        className={cn(
          'flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-md border border-line md:max-h-[88vh] md:max-w-[560px]',
          surfaceClasses(4, 4),
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <div className="truncate font-heading text-[1.125rem] font-bold text-white md:text-[16px]">
              {poster.title}
            </div>
            {poster.subtitle && (
              <div className="mt-0.5 truncate text-[0.75rem] text-[#8f8f8f] md:text-[10px]">
                {poster.subtitle}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(poster.downloadUrl || poster.src) && (
              <a
                href={poster.downloadUrl ?? poster.src}
                download
                aria-label={downloadLabel}
                title={downloadLabel}
                className="flex size-11 items-center justify-center text-[#8f8f8f] transition-colors hover:text-white md:size-8"
                onClick={(event) => event.stopPropagation()}
              >
                <Download size={20} className="md:h-4 md:w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex size-11 items-center justify-center text-[#8f8f8f] transition-colors hover:text-white md:size-8"
            >
              <X size={22} className="md:h-[17px] md:w-[17px]" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#0c0c0f]">
          <div className="flex h-full min-h-[280px] items-center justify-center">
            {poster.src ? (
              <HoverZoomImage src={poster.src} alt={`${poster.title} poster`} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[0.8125rem] text-[#8f8f8f] md:text-[11px]">
                {posterEmptyLabel}
              </div>
            )}
          </div>
        </div>

        {(onPrevious || onNext) && (
          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              aria-label={previousLabel}
              className="flex size-11 items-center justify-center text-[#d4d4d8] transition-colors hover:text-white disabled:opacity-25 md:size-8"
            >
              <ChevronLeft size={22} className="md:h-[18px] md:w-[18px]" />
            </button>
            {typeof index === 'number' && typeof total === 'number' && (
              <span className="text-[0.75rem] tabular-nums text-[#8f8f8f] md:text-[10px]">
                {index + 1} / {total}
              </span>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label={nextLabel}
              className="flex size-11 items-center justify-center text-[#d4d4d8] transition-colors hover:text-white disabled:opacity-25 md:size-8"
            >
              <ChevronRight size={22} className="md:h-[18px] md:w-[18px]" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
