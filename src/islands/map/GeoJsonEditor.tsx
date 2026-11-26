import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { NPC_GEOJSON, SITE_AREAS_GEOJSON } from '../../lib/map/site-areas';

/**
 * DEV-only GeoJSON debugger for the basemap site geometry. Renders every
 * polygon ring in screen space and lets each vertex be dragged; the MapLibre
 * source is updated on the fly so the fill follows the dot. Export prints/
 * copies the edited FeatureCollection (there is no file write from a browser).
 *
 * Independent of the frame-space GeometryEditor: this only touches the
 * decoupled `npc-buildings` / `site-areas` sources.
 */

type LayerKey = 'npc' | 'areas';

const LAYERS: {
  key: LayerKey;
  source: string;
  initial: FeatureCollection<Polygon>;
  label: string;
}[] = [
  { key: 'npc', source: 'npc-buildings', initial: NPC_GEOJSON, label: 'NPC' },
  { key: 'areas', source: 'site-areas', initial: SITE_AREAS_GEOJSON, label: 'Areas' },
];

type Point2 = [number, number];

function getMap(): MapLibreMap | null {
  return (window as unknown as { __icdMap?: MapLibreMap }).__icdMap ?? null;
}

export default function GeoJsonEditor() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dataRef = useRef<Record<LayerKey, FeatureCollection<Polygon>>>({
    npc: structuredClone(NPC_GEOJSON),
    areas: structuredClone(SITE_AREAS_GEOJSON),
  });
  const dragRef = useRef<{ layer: LayerKey; fi: number; vi: number } | null>(null);
  const frameRef = useRef(0);

  const schedule = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      setTick((tick) => tick + 1);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let map: MapLibreMap | null = null;

    const boot = () => {
      const candidate = getMap();
      if (
        !candidate ||
        !candidate.getSource('site-areas') ||
        !candidate.getSource('npc-buildings')
      ) {
        timer = window.setTimeout(boot, 250);
        return;
      }
      if (cancelled) return;
      map = candidate;
      mapRef.current = candidate;
      setReady(true);
      candidate.on('move', schedule);
      candidate.on('zoom', schedule);
      candidate.on('resize', schedule);
    };
    boot();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      map?.off('move', schedule);
      map?.off('zoom', schedule);
      map?.off('resize', schedule);
    };
  }, [schedule]);

  // Vertex drag: unproject to lng/lat and push straight into the live source.
  useEffect(() => {
    if (!ready) return;
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const map = mapRef.current;
      if (!drag || !map) return;
      const rect = map.getContainer().getBoundingClientRect();
      const point = map.unproject([event.clientX - rect.left, event.clientY - rect.top]);
      const collection = dataRef.current[drag.layer];
      const ring = collection.features[drag.fi].geometry.coordinates[0];
      const next: [number, number] = [point.lng, point.lat];
      ring[drag.vi] = next;
      if (drag.vi === 0) ring[ring.length - 1] = next;
      if (drag.vi === ring.length - 1) ring[0] = next;
      const layer = LAYERS.find((item) => item.key === drag.layer);
      if (layer) {
        (map.getSource(layer.source) as GeoJSONSource | undefined)?.setData(
          collection,
        );
      }
      schedule();
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [ready, schedule]);

  const copy = (key: LayerKey) => {
    const layer = LAYERS.find((item) => item.key === key);
    const text = JSON.stringify(dataRef.current[key], null, 2);
    navigator.clipboard?.writeText(text).catch(() => {});
    console.info(`[geo] ${layer?.label ?? key}`, text);
  };

  const reset = () => {
    const map = mapRef.current;
    for (const layer of LAYERS) {
      dataRef.current[layer.key] = structuredClone(layer.initial);
      (map?.getSource(layer.source) as GeoJSONSource | undefined)?.setData(
        dataRef.current[layer.key],
      );
    }
    schedule();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-20 z-[90] border border-[#34343a] bg-[#0c0c0f] px-3 py-2 font-mono text-[10px] text-white shadow-lg"
      >
        GEO
      </button>
    );
  }

  const map = mapRef.current;
  const rect = map?.getContainer().getBoundingClientRect();

  return (
    <>
      {ready && map && rect && (
        <svg className="pointer-events-none fixed inset-0 z-[94] h-full w-full">
          {LAYERS.map((layer) =>
            dataRef.current[layer.key].features.map((feature, fi) => {
              const ring = feature.geometry.coordinates[0];
              const points: Point2[] = ring.map(([lng, lat]) => {
                const projected = map.project({ lng, lat });
                return [projected.x + rect.left, projected.y + rect.top];
              });
              const stroke =
                layer.key === 'npc'
                  ? '#9a9aa5'
                  : String(feature.properties?.color ?? '#ffffff');
              return (
                <g key={`${layer.key}-${fi}`}>
                  <polygon
                    points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                  {points.slice(0, -1).map(([x, y], vi) => (
                    <circle
                      key={`${layer.key}-${fi}-${vi}`}
                      cx={x}
                      cy={y}
                      r={5}
                      fill="#0c0c0f"
                      stroke={stroke}
                      strokeWidth={2}
                      className="pointer-events-auto cursor-grab active:cursor-grabbing"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dragRef.current = { layer: layer.key, fi, vi };
                      }}
                    />
                  ))}
                </g>
              );
            }),
          )}
        </svg>
      )}

      <div className="fixed bottom-4 left-20 z-[95] w-[300px] border border-[#34343a] bg-[#0c0c0f] p-3 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold tracking-[0.12em]">
            GEO JSON
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-1 text-[#8f8f8f] hover:text-white"
            aria-label="Close geo debug"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-[#8f8f8f]">
          {ready ? 'Drag the dots — the map updates live.' : 'Waiting for the map…'}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => copy('areas')}
            className="border border-[#34343a] px-2 py-1.5 text-left hover:border-[#ff2d6f]"
          >
            COPY AREAS
          </button>
          <button
            type="button"
            onClick={() => copy('npc')}
            className="border border-[#34343a] px-2 py-1.5 text-left hover:border-[#ff2d6f]"
          >
            COPY NPC
          </button>
          <button
            type="button"
            onClick={reset}
            className="col-span-2 border border-[#34343a] px-2 py-1.5 text-left hover:border-[#ff2d6f]"
          >
            RESET TO SOURCE
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#8f8f8f]">
          <span className="inline-flex items-center gap-1">
            <i className="size-2 bg-[#5b8def]" /> Toilet
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="size-2 bg-[#3c6136]" /> VIP
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="size-2 bg-[#ff2d6f]" /> Parking
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="size-2 bg-[#3b3b42]" /> NPC
          </span>
        </div>
      </div>
    </>
  );
}
