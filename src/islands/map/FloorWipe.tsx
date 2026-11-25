import { memo, useLayoutEffect, useRef, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { mapTransitionKey } from '../../lib/map/transition';
import PixelTransition from '../../components/map/PixelTransition';

/** Half of the PixelTransition run: 0.18 s ≈ 360 ms total. */
const WIPE_STEP_SECONDS = 0.18;
/** Keep the transparent shell mounted briefly after the animation settles. */
const WIPE_LIFETIME_MS = 520;

type Wipe = { id: number; active: boolean };

/**
 * Short pixel veil for every plan/floor swap (Career Expo, Walk-in, Career
 * Counseling). GIK is a camera overview, not a floor swap, so it does not
 * trigger the veil; the first venue click after reload stays clean.
 * Mounted in a layout effect so the dark frame is painted before the new
 * plan/camera frame underneath is revealed.
 */
function FloorWipe() {
  const selectedVenueId = useMapStore((s) => s.selectedVenueId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectedTrackId = useMapStore((s) => s.selectedTrackId);

  const key = mapTransitionKey({
    venueId: selectedVenueId,
    areaId: selectedAreaId,
    trackId: selectedTrackId,
  });

  const prevKeyRef = useRef<string | null>(null);
  const wipeIdRef = useRef(0);
  const [wipe, setWipe] = useState<Wipe | null>(null);

  useLayoutEffect(() => {
    // Never veil the initial mount — the splash owns that reveal.
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      return;
    }
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    const id = ++wipeIdRef.current;
    setWipe({ id, active: false });

    const raf = requestAnimationFrame(() => {
      setWipe((current) =>
        current && current.id === id ? { ...current, active: true } : current,
      );
    });
    const timeout = window.setTimeout(() => {
      setWipe((current) => (current && current.id === id ? null : current));
    }, WIPE_LIFETIME_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [key]);

  if (!wipe) return null;

  return (
    <div
      key={wipe.id}
      data-floor-wipe=""
      className="pointer-events-none absolute inset-0 z-[12]"
    >
      <PixelTransition
        firstContent={<div className="absolute inset-0 bg-[#09090b]" />}
        secondContent={<div className="absolute inset-0" />}
        gridSize={24}
        pixelColor="#2a2a2a"
        pixelFill="#2a2a2a"
        pixelBorder="#ff2d6f"
        mosaic={0.1}
        animationStepDuration={WIPE_STEP_SECONDS}
        pattern="random"
        randomness={0.72}
        pixelAnimation="pop"
        pixelShape="square"
        gap={0.2}
        trigger="click"
        active={wipe.active}
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

export default memo(FloorWipe);
