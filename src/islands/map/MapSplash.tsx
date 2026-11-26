import { useEffect, useState } from 'react';
import PixelTransition from '../../components/map/PixelTransition';
import SelectionFrame from '../../components/ui/SelectionFrame';
import Shuffle from '../../components/map/Shuffle';
import { ui } from '../../lib/data';

const MIN_VISIBLE_MS = 400;
const MAX_VISIBLE_MS = 6000;
const EXIT_MS = 400;

type ReadyWindow = Window & { __icdMapReady?: boolean };

const [lockupLine1, ...lockupRest] = ui.event.titleLine2.split(' ');
const lockupLine2 = lockupRest.join(' ');

/**
 * Grey skeleton splash with the actual header lockup centred. The lockup
 * sheen runs until the map reports ready; PixelTransition then reveals the
 * live map. No illustration and no extra loading copy.
 */
export default function MapSplash() {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  // Fewer columns on mobile => noticeably larger mosaic pixels.
  const [gridSize, setGridSize] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches
      ? 12
      : 24,
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setGridSize(media.matches ? 12 : 24);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let onReady: (() => void) | null = null;

    const min = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_VISIBLE_MS);
    });
    const ready = new Promise<void>((resolve) => {
      if ((window as ReadyWindow).__icdMapReady) {
        resolve();
        return;
      }
      onReady = () => resolve();
      window.addEventListener('icd:map-ready', onReady, { once: true });
    });
    const max = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MAX_VISIBLE_MS);
    });

    Promise.race([Promise.all([min, ready]), max]).then(() => {
      if (cancelled) return;
      setActive(true);
      window.setTimeout(() => setDone(true), EXIT_MS);
    });

    return () => {
      cancelled = true;
      if (onReady) window.removeEventListener('icd:map-ready', onReady);
    };
  }, []);

  useEffect(() => {
    if (done) window.dispatchEvent(new CustomEvent('icd:splash-done'));
  }, [done]);

  if (done) return null;

  return (
    <div className="absolute inset-0 z-[100] overflow-hidden bg-[#1d1d1d]">
      <PixelTransition
        firstContent={
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#1d1d1d]">
            <img
              src="/maps/splash-basemap.webp"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 skeleton-shimmer opacity-[0.08]" />
            <div className="relative flex flex-col items-center">
              <div className="tag-ribbon relative z-10 overflow-hidden">
                <Shuffle
                  text={ui.event.exploreBadge}
                  effect="slide"
                  shuffleDirection="right"
                  duration={0.35}
                  animationMode="evenodd"
                  shuffleTimes={1}
                  ease="power3.out"
                  stagger={0.03}
                  threshold={0.1}
                  triggerOnce
                  triggerOnHover={false}
                  hoverRadius={0}
                  motionBlur={false}
                  respectReducedMotion
                />
              </div>

              <div className="splash-lockup relative z-10 mt-5">
                <SelectionFrame frameClassName="-left-[4px] -top-[5px] -right-[22px] -bottom-[7px]">
                  <div className="flex items-center gap-[3px]">
                    <span className="font-heading shrink-0 text-[38px] font-bold leading-[0.8] tracking-[-1.8px] text-white md:text-[56px]">
                      {ui.event.titleLine1}
                    </span>
                    <span className="font-heading shrink-0 whitespace-nowrap text-[16px] font-bold leading-[0.95] tracking-[-0.5px] text-white md:text-[23px]">
                      {lockupLine1}
                      <br />
                      {lockupLine2}
                    </span>
                  </div>
                </SelectionFrame>
              </div>
            </div>
          </div>
        }
        secondContent={<div className="absolute inset-0" />}
        gridSize={gridSize}
        pixelColor="#2a2a2a"
        pixelFill="#2a2a2a"
        pixelBorder="#ff2d6f"
        mosaic={0.1}
        animationStepDuration={0.18}
        pattern="random"
        randomness={0.72}
        pixelAnimation="pop"
        pixelShape="square"
        gap={0.2}
        fps={0}
        trigger="click"
        active={active}
        once
        onActiveChange={() => {}}
        aspectRatio="auto"
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        decorative
      />
    </div>
  );
}
