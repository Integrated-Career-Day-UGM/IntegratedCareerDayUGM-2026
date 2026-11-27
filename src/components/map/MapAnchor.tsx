import { useEffect, useRef, type ReactNode } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Anchors DOM to a lng/lat and scales it with the camera, so the art lives in
 * MAP space: it grows/shrinks with the map instead of holding a fixed screen
 * size. Clamped so max zoom-in can't produce a billboard and max zoom-out
 * can't shrink it to nothing.
 *
 * Positions are written straight to the DOM on `render` (same loop the
 * tooltip needle uses) plus the camera events, so it never lags a flight.
 */
export default function MapAnchor({
  map,
  center,
  baseZoom = 18.3,
  children,
}: {
  map: MapLibreMap | null;
  center: [number, number];
  baseZoom?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map) return;

    const position = () => {
      const element = ref.current;
      if (!element) return;
      try {
        const point = map.project(center);
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
        const zoomScale = Math.min(
          1.4,
          Math.max(0.6, 2 ** (map.getZoom() - baseZoom)),
        );
        element.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px) scale(${zoomScale.toFixed(3)})`;
        // Fade with the same clamp: 20% at max zoom-out -> 55% at entry -> 90%
        // at max zoom-in. The art shrinks out of the way instead of crowding
        // the map when the whole venue is visible.
        const opacity = 0.2 + ((zoomScale - 0.6) / 0.8) * 0.7;
        element.style.opacity = opacity.toFixed(2);
      } catch (error) {
        console.error('[maplibre] sparky anchor', error);
      }
    };

    const raf = window.requestAnimationFrame(position);
    position();
    // `render` is what keeps the tooltip needle glued during animated camera
    // flights; the camera events alone can leave a frame of lag.
    map.on('render', position);
    map.on('move', position);
    map.on('zoom', position);
    map.on('rotate', position);
    map.on('resize', position);
    map.on('idle', position);
    return () => {
      window.cancelAnimationFrame(raf);
      map.off('render', position);
      map.off('move', position);
      map.off('zoom', position);
      map.off('rotate', position);
      map.off('resize', position);
      map.off('idle', position);
    };
  }, [map, center, baseZoom]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute top-0 left-0 will-change-transform"
      style={{ transformOrigin: '0 0' }}
    >
      {children}
    </div>
  );
}
