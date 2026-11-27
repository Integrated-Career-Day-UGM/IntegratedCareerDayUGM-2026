import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, MapPin, X } from 'lucide-react';
import { CategoryTag } from './CompanyProfileBlocks';
import { surfaceClasses } from '../../lib/surface-classes';
import { cn } from '../../lib/utils/cn';
import { downloadFullPoster } from '../../lib/posters/downloadPoster';
import type { Company, CompanyPoster } from '../../types/map';

const FULL_THUMB = 120;
const COLLAPSED_THUMB = 35;
const THUMB_GAP = 2;
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

type Props = {
  items: CompanyPoster[];
  company?: Company;
  /** Fallback title for non-company galleries (ICD posters, single opening posters). */
  heading?: string;
  index: number;
  onIndexChange?: (index: number) => void;
  onOpenBooth?: () => void;
  onClose: () => void;
};

function Thumbnails({
  items,
  index,
  onSelect,
  vertical,
}: {
  items: CompanyPoster[];
  index: number;
  onSelect: (index: number) => void;
  vertical: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (vertical) {
      el.scrollTo({
        top: Math.max(0, index * 72 - el.clientHeight / 2 + 32),
        behavior: 'smooth',
      });
      return;
    }
    let left = 2;
    for (let i = 0; i < index; i += 1) left += COLLAPSED_THUMB + THUMB_GAP;
    left -= Math.max(0, el.clientWidth / 2 - FULL_THUMB / 2);
    el.scrollTo({ left, behavior: 'smooth' });
  }, [index, vertical]);

  return (
    <div
      ref={ref}
      className={cn(
        'overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        vertical ? 'h-full' : 'w-full',
      )}
    >
      <div
        className={cn(
          'flex gap-2',
          vertical ? 'flex-col' : 'flex-row',
        )}
      >
        {items.map((poster, posterIndex) => {
          const active = posterIndex === index;
          return (
            <motion.button
              key={poster.id}
              type="button"
              onClick={() => onSelect(posterIndex)}
              whileHover={{ scale: 1.04, opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'relative shrink-0 overflow-hidden rounded-[6px] border transition-colors',
                vertical ? 'h-16 w-full' : 'h-16 w-24',
                active ? 'border-[var(--accent-pink)]' : 'border-line opacity-60',
              )}
              aria-label={`View ${poster.title}`}
            >
              <img
                src={poster.thumbUrl}
                alt=""
                className="pointer-events-none h-full w-full select-none object-cover"
                draggable={false}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Company poster gallery. Desktop: three columns (info / A4 poster / vertical
 * thumbnails). Mobile: Instagram-style stacked caption. Local WebP only.
 */
export default function PosterGalleryModal({
  items,
  company,
  heading,
  index,
  onIndexChange,
  onOpenBooth,
  onClose,
}: Props) {
  const [current, setCurrent] = useState(index);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(current);
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion() ?? false;
  const item = items[current];

  currentRef.current = current;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    if (dragging) return;
    const width = containerRef.current?.offsetWidth ?? 1;
    animate(
      x,
      -current * width,
      reduceMotion
        ? { duration: 0 }
        : {
            type: 'spring',
            stiffness: 300,
            damping: 30,
          },
    );
  }, [current, dragging, reduceMotion, x]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      animate(x, -currentRef.current * el.offsetWidth, { duration: 0 });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [x]);

  if (!item) return null;

  function go(delta: number) {
    const next = Math.max(0, Math.min(items.length - 1, currentRef.current + delta));
    if (next === currentRef.current) return;
    setCurrent(next);
    onIndexChange?.(next);
  }

  const categories = Array.from(
    new Map(
      (company?.profile?.categories ?? []).map((category) => [
        category.toLowerCase(),
        category,
      ]),
    ).values(),
  );
  const description = company?.description ?? company?.profile?.description ?? null;
  const title = company?.name ?? heading ?? item.companyName;
  // A4 posters get an A4 frame; non-company sets (ICD) are usually landscape.
  const portrait = Boolean(company);

  const info = (
    <div className="flex min-h-0 flex-col gap-3 px-1 pt-2 md:pt-3">
      <div className="hidden md:block">
        <div className="text-balance font-heading text-[1.35rem] font-bold leading-tight text-white">
          {title}
        </div>
      </div>

      {description && (
        <p className="order-2 text-pretty text-[0.8125rem] leading-relaxed text-[#a1a1aa] md:order-2 md:text-[12px]">
          {description}
        </p>
      )}

      {categories.length > 0 && (
        <div className="order-3 flex flex-wrap gap-1.5 md:order-1">
          {categories.slice(0, 5).map((category, index) => (
            <CategoryTag key={`${category}-${index}`} label={category} />
          ))}
        </div>
      )}

      <div className="order-1 mt-0 flex flex-col gap-2 md:order-3 md:mt-auto">
        {onOpenBooth && (
          <button
            type="button"
            onClick={onOpenBooth}
            className="cta-bar group relative flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden bg-white px-3 text-black transition-transform duration-150 focus-visible:bg-[var(--accent-pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.99]"
          >
            <span
              aria-hidden="true"
              className="cta-fill pointer-events-none absolute inset-0 bg-[var(--accent-pink)]"
            />
            <MapPin size={15} className="cta-content relative z-10 shrink-0" />
            <span className="cta-content relative z-10 font-heading text-[13px] font-bold leading-none tracking-[-0.1px]">
              Open booth
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => void downloadFullPoster(item.src, `${title} - ${item.title}`)}
          aria-label={`Download ${item.title}`}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-line pl-2.5 pr-3 text-[0.75rem] font-semibold text-white transition-colors hover:border-[#4a4a52] hover:bg-[#26262b] active:scale-[0.99]"
        >
          <Download size={15} />
          Download
        </button>
        <div className="hidden items-center justify-end text-[0.6875rem] text-[#8f8f8f] md:flex">
          <span className="shrink-0 tabular-nums">
            {current + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 p-2 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} posters`}
        className={cn(
          'relative flex max-h-[calc(100dvh-1rem)] w-full max-w-[980px] flex-col overflow-y-auto rounded-[15px] border-2 border-[#2a2a2e] text-white md:h-[min(84vh,760px)] md:overflow-hidden md:border-4',
          surfaceClasses(1, 6),
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close poster gallery"
          className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-[10px] border border-white/15 bg-black/75 text-white shadow-surface-3 backdrop-blur-sm transition-colors hover:bg-[#26262b]"
        >
          <X size={22} />
        </button>

        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-3 py-2 pr-14 md:hidden">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 break-words font-heading text-[1rem] font-bold leading-tight text-white">
              {title}
            </div>
            <div className="mt-0.5 text-[0.6875rem] text-[#8f8f8f]">
              {current + 1} of {items.length}
            </div>
          </div>
        </div>

        <div className="grid flex-none grid-cols-1 md:min-h-0 md:flex-1 md:grid-cols-[260px_minmax(0,1fr)_104px]">
          <aside className="order-2 min-h-0 border-t border-line bg-surface-2 p-3 md:order-1 md:overflow-y-auto md:border-t-0 md:border-r md:p-4">
            {info}
          </aside>

          <section className="order-1 flex min-h-0 items-center justify-center bg-surface-1 p-2 md:order-2 md:p-4">
            <div
              ref={containerRef}
              className={cn(
                'relative w-full overflow-hidden rounded-[12px] border border-[#2a2a2e] bg-[#050506] md:aspect-auto md:h-full md:max-w-full',
                portrait
                  ? 'aspect-[4/5] md:w-auto'
                  : 'aspect-[4/3] md:w-full',
              )}
            >
              <motion.div
                className="flex h-full"
                drag={items.length > 1 ? 'x' : false}
                dragElastic={0.2}
                dragMomentum={false}
                onDragStart={() => setDragging(true)}
                onDragEnd={(_, infoEvent) => {
                  setDragging(false);
                  const width = containerRef.current?.offsetWidth ?? 1;
                  const offset = infoEvent.offset.x;
                  const velocity = infoEvent.velocity.x;
                  let next = currentRef.current;
                  if (Math.abs(velocity) > SWIPE_VELOCITY) {
                    next = velocity > 0 ? next - 1 : next + 1;
                  } else if (
                    Math.abs(offset) > width * 0.3 ||
                    Math.abs(offset) > SWIPE_DISTANCE
                  ) {
                    next = offset > 0 ? next - 1 : next + 1;
                  }
                  next = Math.max(0, Math.min(items.length - 1, next));
                  if (next !== currentRef.current) {
                    setCurrent(next);
                    onIndexChange?.(next);
                  } else {
                    animate(
                      x,
                      -currentRef.current * width,
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          },
                    );
                  }
                }}
                style={{ x }}
              >
                {items.map((poster) => (
                  <div
                    key={poster.id}
                    className={cn(
                      'flex w-full shrink-0 items-center justify-center md:aspect-auto md:h-full',
                      portrait ? 'aspect-[4/5] md:aspect-[210/297]' : 'aspect-[4/3]',
                    )}
                  >
                    <img
                      src={poster.src}
                      alt={poster.title}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </motion.div>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    disabled={current === 0}
                    aria-label="Previous poster"
                    className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-25"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={current === items.length - 1}
                    aria-label="Next poster"
                    className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-25"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
          </section>

          {items.length > 1 && (
            <aside className="order-3 flex min-h-0 gap-2 border-t border-line bg-surface-2 p-2 md:flex-col md:overflow-y-auto md:border-t-0 md:border-l md:p-2 md:pt-14">
              <div className="w-full md:hidden">
                <Thumbnails
                  items={items}
                  index={current}
                  vertical={false}
                  onSelect={(next) => {
                    setCurrent(next);
                    onIndexChange?.(next);
                  }}
                />
              </div>
              <div className="hidden h-full w-full md:block">
                <Thumbnails
                  items={items}
                  index={current}
                  vertical
                  onSelect={(next) => {
                    setCurrent(next);
                    onIndexChange?.(next);
                  }}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
