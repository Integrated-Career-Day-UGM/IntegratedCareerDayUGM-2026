import { useCallback, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import FixedPin from '../../components/map/FixedPin';

export type FixedPinSpec = {
  id: string;
  label: string;
  center: [number, number];
  color: string;
  icon: LucideIcon;
  /** Inactive-floor pins render at 30%. */
  dimmed?: boolean;
  /** Basemap pins can open a facility (toilet) on click. */
  interactive?: boolean;
};

/**
 * Screen-space fixed pins. They render ABOVE the warped floor-plan overlay
 * (MapLibre markers live inside the map container, under it), so a pin can
 * sit inside the hull — e.g. Career Expo — without being covered by the plan
 * art. Positions are written straight to the DOM on camera changes; no React
 * render per map frame.
 */
export default function MapFixedPins({
  map,
  pins,
  onSelect,
}: {
  map: MapLibreMap | null;
  pins: FixedPinSpec[];
  onSelect?: (id: string) => void;
}) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const position = useCallback(() => {
    if (!map) return;
    for (const pin of pins) {
      const element = refs.current[pin.id];
      if (!element) continue;
      const projected = map.project(pin.center);
      element.style.transform = `translate(${projected.x}px, ${projected.y}px) translate(-50%, -100%)`;
    }
  }, [map, pins]);

  useEffect(() => {
    if (!map) return;
    // First paint can land before the container has its final size; re-run
    // once the next frame is committed, and again on idle after animations.
    const raf = window.requestAnimationFrame(position);
    position();
    map.on('move', position);
    map.on('zoom', position);
    map.on('rotate', position);
    map.on('pitch', position);
    map.on('resize', position);
    map.on('idle', position);
    return () => {
      window.cancelAnimationFrame(raf);
      map.off('move', position);
      map.off('zoom', position);
      map.off('rotate', position);
      map.off('pitch', position);
      map.off('resize', position);
      map.off('idle', position);
    };
  }, [map, position]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
      {pins.map((pin) => (
        <div
          key={pin.id}
          ref={(element) => {
            refs.current[pin.id] = element;
          }}
          className={`absolute left-0 top-0 will-change-transform ${
            pin.interactive ? 'pointer-events-auto cursor-pointer' : ''
          }`}
          style={{ opacity: pin.dimmed ? 0.3 : 1 }}
          onClick={pin.interactive ? () => onSelect?.(pin.id) : undefined}
          role={pin.interactive ? 'button' : undefined}
          tabIndex={pin.interactive ? 0 : undefined}
          aria-label={pin.interactive ? pin.label : undefined}
          onKeyDown={
            pin.interactive
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect?.(pin.id);
                  }
                }
              : undefined
          }
        >
          <FixedPin label={pin.label} color={pin.color} icon={pin.icon} />
        </div>
      ))}
    </div>
  );
}
