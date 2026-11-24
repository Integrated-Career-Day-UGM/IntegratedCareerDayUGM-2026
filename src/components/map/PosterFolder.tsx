import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { posters, ui } from '../../lib/data';
import type { PosterInfo } from '../../types/map';
import { cn } from '../../lib/utils/cn';
import { surfaceClasses } from '../../lib/surface-classes';
import HoverZoomImage from './HoverZoomImage';

function PosterSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#202024]">
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#202024_8%,#2a2a2f_18%,#202024_33%)] bg-[length:200%_100%]" />
      <div className="absolute inset-x-2 bottom-2 h-2 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function PosterArtwork({
  poster,
  broken,
  onError,
  compact = false,
  contain = false,
  zoom = false,
}: {
  poster: PosterInfo;
  broken: boolean;
  onError: () => void;
  compact?: boolean;
  contain?: boolean;
  zoom?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {broken || !poster.src ? (
        <PosterSkeleton />
      ) : zoom ? (
        <HoverZoomImage src={poster.src} alt={poster.title} />
      ) : (
        <>
          <img
            src={poster.src}
            alt={poster.title}
            loading="lazy"
            onError={onError}
            className={cn('h-full w-full', contain ? 'object-contain' : 'object-cover')}
          />
          {compact && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-[8px] font-medium text-white">
              {poster.title}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const SKELETON_ITEMS: PosterInfo[] = [0, 1, 2].map((index) => ({
  id: `skeleton-${index}`,
  title: ' ',
  subtitle: ' ',
  src: '',
  accent: '#27272a',
}));

export default function PosterFolder({
  className,
  variant = 'folder',
  items = posters,
  title = ui.posters.title,
  hideTitle = false,
  hint = ui.posters.hint,
  onOpenInfo,
}: {
  className?: string;
  /** Folder is the desktop gimmick; carousel is the calmer mobile version. */
  variant?: 'folder' | 'carousel';
  /** Defaults to the ICD poster set; pass company posters to reuse the shell. */
  items?: PosterInfo[];
  title?: string;
  hideTitle?: boolean;
  hint?: string;
  /** Map folders use this to jump to the matching Info carousel. */
  onOpenInfo?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const isSkeleton = items.length === 0;
  const displayItems = isSkeleton ? SKELETON_ITEMS : items;
  const current = selected === null ? null : displayItems[selected];

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'ArrowLeft') {
        setSelected((index) => (index === null ? null : Math.max(0, index - 1)));
      }
      if (event.key === 'ArrowRight') {
        setSelected((index) =>
          index === null ? null : Math.min(displayItems.length - 1, index + 1),
        );
      }
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [selected]);

  if (items.length === 0 && !isSkeleton) return null;

  return (
    <div className={cn('select-none', className)}>
      {variant === 'carousel' ? (
        <>
          <div className="mb-2 flex items-end justify-between">
            {!hideTitle && (
              <div className="font-heading text-[15px] font-bold leading-none text-white">
                {title}
              </div>
            )}
            <div className="ml-auto text-[9px] text-[#8f8f8f]">
              {isSkeleton
                ? ui.posters.loading
                : ui.posters.count.replace('{count}', String(items.length))}
            </div>
          </div>
          <div
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
            onScroll={(event) => {
              const el = event.currentTarget;
              const center = el.scrollLeft + el.clientWidth / 2;
              let nearest = 0;
              let best = Number.POSITIVE_INFINITY;
              [...el.children].forEach((child, index) => {
                const node = child as HTMLElement;
                const middle = node.offsetLeft + node.offsetWidth / 2;
                const distance = Math.abs(middle - center);
                if (distance < best) {
                  best = distance;
                  nearest = index;
                }
              });
              setCarouselIndex(nearest);
            }}
          >
            {displayItems.map((poster, index) => (
              <button
                key={poster.id}
                type="button"
                disabled={isSkeleton}
                onClick={() => {
                  if (!isSkeleton) setSelected(index);
                }}
                className={cn(
                  'w-[96px] shrink-0 snap-start overflow-hidden rounded-md border border-line text-left',
                  surfaceClasses(3, 3),
                )}
              >
                <div className="aspect-[4/3]">
                  <PosterArtwork
                    poster={poster}
                    broken={!!broken[poster.id]}
                    onError={() => setBroken((state) => ({ ...state, [poster.id]: true }))}
                    compact
                  />
                </div>
                <div className="truncate px-2 py-1.5 text-[9px] font-medium text-white">
                  {poster.title}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-1 text-[9px] tabular-nums text-[#8f8f8f]">
            {isSkeleton ? '' : `${carouselIndex + 1} / ${items.length}`}
          </div>
        </>
      ) : (
        <>
          <div
            onClick={() => {
              if (onOpenInfo) onOpenInfo();
              else setExpanded((open) => !open);
            }}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') setExpanded(true);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setExpanded(false);
            }}
            className="relative mx-auto flex h-[128px] w-full max-w-[200px] origin-top cursor-pointer items-center justify-center"
            style={{ perspective: '1000px' }}
          >
            {/* Folder back */}
            <div
              className="absolute rounded-md bg-[#1c1c20] shadow-md"
              style={{
                width: 96,
                height: 70,
                transformOrigin: 'bottom center',
                transform: expanded ? 'rotateX(-15deg)' : 'rotateX(0deg)',
                transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 10,
              }}
            />
            <div
              className="absolute h-2.5 w-8 rounded-t-md bg-[#242429]"
              style={{ transform: 'translate(-28px, -40px)', zIndex: 10 }}
            />

            {/* Poster cards — tucked behind the folder front */}
            {displayItems.map((poster, index) => {
              const offsets = [-35, 0, 35];
              const rotations = [-8, 0, 8];
              return (
                <button
                  key={poster.id}
                  type="button"
                  disabled={isSkeleton}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isSkeleton) setSelected(index);
                  }}
                  onFocus={() => setExpanded(true)}
                  className="absolute left-1/2 top-1/2 h-[78px] w-[58px] overflow-hidden rounded-md border border-[#3a3a40] bg-[#141416] text-left shadow-xl transition-[transform,opacity] duration-500"
                  style={{
                    zIndex: 20,
                    transform: expanded
                      ? `translate(-50%, -50%) translate(${offsets[index] ?? 0}px, -48px) rotate(${rotations[index] ?? 0}deg)`
                      : 'translate(-50%, -50%) translateY(0) rotate(0deg) scale(0.72)',
                    opacity: expanded ? 1 : 0,
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transitionDelay: `${index * 55}ms`,
                  }}
                >
                  <PosterArtwork
                    poster={poster}
                    broken={!!broken[poster.id]}
                    onError={() => setBroken((state) => ({ ...state, [poster.id]: true }))}
                    compact
                  />
                </button>
              );
            })}

            {/* Folder front */}
            <div
              className="absolute rounded-md bg-[#29292e] shadow-lg"
              style={{
                width: 96,
                height: 70,
                transformOrigin: 'bottom center',
                transform: expanded ? 'rotateX(25deg) translateY(8px)' : 'rotateX(0deg)',
                transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 30,
              }}
            />
            <div
              className="pointer-events-none absolute rounded-md"
              style={{
                width: 96,
                height: 70,
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 52%)',
                transformOrigin: 'bottom center',
                transform: expanded ? 'rotateX(25deg) translateY(8px)' : 'rotateX(0deg)',
                transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 31,
              }}
            />
          </div>

          {/* Folder title + cue live below the art, never as a stray label. */}
          <div
            className={`mt-1 text-center ${onOpenInfo ? 'cursor-pointer' : ''}`}
            onClick={onOpenInfo}
          >
            {!hideTitle && (
              <div className="font-heading text-[15px] font-bold leading-none text-white">
                {title}
              </div>
            )}
            <div className="mt-0.5 text-[9px] text-[#8f8f8f]">
              {isSkeleton
                ? ui.posters.loading
                : ui.posters.count.replace('{count}', String(items.length))}
            </div>
            <div
              className="mt-0.5 text-[9px] text-[#8f8f8f] transition-opacity duration-300"
              style={{ opacity: expanded ? 0 : 1 }}
            >
              {hint}
            </div>
          </div>
        </>
      )}

      {current &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <div
              className={cn(
                'flex max-h-[88vh] w-full max-w-[420px] flex-col overflow-hidden rounded-md border border-line md:max-w-[540px]',
                surfaceClasses(4, 4),
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-heading text-[16px] font-bold text-white">
                    {current.title}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-[#8f8f8f]">
                    {current.subtitle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={ui.posters.close}
                  className="flex size-8 shrink-0 items-center justify-center text-[#8f8f8f] transition-colors hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="relative min-h-0 flex-1 bg-[#0c0c0f]">
                <div className="flex h-full min-h-[280px] items-center justify-center">
                  <PosterArtwork
                    poster={current}
                    broken={!!broken[current.id]}
                    onError={() =>
                      setBroken((state) => ({ ...state, [current.id]: true }))
                    }
                    contain
                    zoom
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line px-3 py-2">
                <button
                  type="button"
                  onClick={() => setSelected((index) => Math.max(0, (index ?? 0) - 1))}
                  disabled={selected === 0}
                  aria-label={ui.posters.previous}
                  className="flex size-8 items-center justify-center text-[#d4d4d8] transition-colors hover:text-white disabled:opacity-25"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] tabular-nums text-[#8f8f8f]">
                  {(selected ?? 0) + 1} / {displayItems.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelected((index) =>
                      Math.min(displayItems.length - 1, (index ?? 0) + 1),
                    )
                  }
                  disabled={selected === displayItems.length - 1}
                  aria-label={ui.posters.next}
                  className="flex size-8 items-center justify-center text-[#d4d4d8] transition-colors hover:text-white disabled:opacity-25"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
