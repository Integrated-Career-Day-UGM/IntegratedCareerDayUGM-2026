import { useMemo, useRef, useState } from 'react';
import { posters, ui } from '../../lib/data';
import type { PosterInfo } from '../../types/map';
import { cn } from '../../lib/utils/cn';
import { surfaceClasses } from '../../lib/surface-classes';
import HoverZoomImage from './HoverZoomImage';
import PosterGalleryModal from './PosterGalleryModal';

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
            src={poster.thumbUrl ?? poster.src}
            alt={poster.title}
            loading="lazy"
            onError={onError}
            className={cn('h-full w-full', contain ? 'object-contain' : 'object-cover')}
          />
          {compact && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-[0.625rem] font-medium text-white md:text-[8px]">
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
  onOpen,
}: {
  className?: string;
  /** Folder is the desktop gimmick; carousel is the calmer Info version. */
  variant?: 'folder' | 'carousel';
  /** Defaults to the ICD poster set; pass company posters to reuse the shell. */
  items?: PosterInfo[];
  title?: string;
  hideTitle?: boolean;
  hint?: string;
  /** Map folders use this to jump to the matching Info section. */
  onOpenInfo?: () => void;
  /** Company folders open a per-company gallery instead of the mixed set. */
  onOpen?: (poster: PosterInfo, index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const isSkeleton = items.length === 0;
  const displayItems = useMemo(
    () =>
      isSkeleton
        ? SKELETON_ITEMS
        : items.filter((poster) => Boolean(poster.src) && !broken[poster.id]),
    [broken, isSkeleton, items],
  );
  const galleryItems = displayItems.map((poster) => ({
    id: poster.id,
    companyId: poster.companyId ?? 'icd',
    companyName: poster.subtitle || poster.title,
    companyShortName: poster.title,
    kind: 'gallery' as const,
    title: poster.title,
    src: poster.src,
    thumbUrl: poster.thumbUrl ?? poster.src,
    downloadUrl: poster.downloadUrl ?? poster.src,
  }));
  const activeCarouselIndex = Math.min(
    carouselIndex,
    Math.max(0, displayItems.length - 1),
  );

  // All posters missing/broken: render no folder at all.
  if (!isSkeleton && displayItems.length === 0) return null;

  return (
    <div ref={rootRef} className={cn('select-none', className)}>
      {variant === 'carousel' ? (
        <>
          <div className="mb-2 flex items-end justify-between">
            {!hideTitle && (
              <div className="font-heading text-[1.0625rem] font-bold leading-none text-white md:text-[15px]">
                {title}
              </div>
            )}
            <div className="ml-auto text-[0.6875rem] text-[#8f8f8f] md:text-[9px]">
              {isSkeleton
                ? ui.posters.loading
                : ui.posters.count.replace('{count}', String(displayItems.length))}
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
                  'w-[calc(50%_-_0.25rem)] shrink-0 snap-start overflow-hidden rounded-md border border-line text-left',
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
                <div className="truncate px-2 py-1.5 text-[0.75rem] font-medium text-white md:text-[9px]">
                  {poster.title}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-1 text-[0.6875rem] tabular-nums text-[#8f8f8f] md:text-[9px]">
            {isSkeleton ? '' : `${activeCarouselIndex + 1} / ${displayItems.length}`}
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
                    if (isSkeleton) return;
                    if (onOpen) onOpen(poster, index);
                    else setSelected(index);
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

      {selected !== null && (
        <PosterGalleryModal
          items={galleryItems}
          heading={title}
          index={selected}
          onIndexChange={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
