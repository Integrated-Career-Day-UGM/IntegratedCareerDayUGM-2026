import { useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';

type CameraReadout = {
  lng: number;
  lat: number;
  zoom: number;
  bearing: number;
  pitch: number;
  west: number;
  south: number;
  east: number;
  north: number;
  minZoom: number;
  maxZoom: number;
  maxBounds: string;
};

function readCamera(map: maplibregl.Map): CameraReadout {
  const center = map.getCenter();
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const maxBounds = map.getMaxBounds();
  return {
    lng: center.lng,
    lat: center.lat,
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
    west: sw.lng,
    south: sw.lat,
    east: ne.lng,
    north: ne.lat,
    minZoom: map.getMinZoom(),
    maxZoom: map.getMaxZoom(),
    maxBounds: maxBounds
      ? `${maxBounds.getSouthWest().lng.toFixed(5)}, ${maxBounds.getSouthWest().lat.toFixed(5)} → ${maxBounds.getNorthEast().lng.toFixed(5)}, ${maxBounds.getNorthEast().lat.toFixed(5)}`
      : 'none',
  };
}

/**
 * DEV-only camera readout for authoring drag/zoom limits. Updates from the
 * map's own events, isolated from the main MapLibreMap render tree.
 */
export default function MapDebugPanel({ map }: { map: maplibregl.Map | null }) {
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState<CameraReadout | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!map) return;
    const read = () => {
      frameRef.current = 0;
      setCamera(readCamera(map));
    };
    const schedule = () => {
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(read);
    };
    read();
    map.on('move', schedule);
    map.on('zoom', schedule);
    map.on('rotate', schedule);
    map.on('pitch', schedule);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      map.off('move', schedule);
      map.off('zoom', schedule);
      map.off('rotate', schedule);
      map.off('pitch', schedule);
    };
  }, [map]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-44 z-[96] border border-[#34343a] bg-[#0c0c0f] px-3 py-2 font-mono text-[10px] text-white shadow-lg"
      >
        CAM
      </button>
    );
  }

  const copy = () => {
    if (!camera) return;
    navigator.clipboard
      ?.writeText(JSON.stringify(camera, null, 2))
      .catch(() => {});
  };

  return (
    <div className="fixed bottom-16 left-4 z-[96] w-72 border border-[#34343a] bg-[#0c0c0f] p-3 font-mono text-[10px] text-white shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold">Camera debug</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-[#34343a] px-1.5 py-0.5 hover:bg-[#1f1f23]"
          aria-label="Close camera debug"
        >
          ×
        </button>
      </div>

      {camera ? (
        <dl className="space-y-1">
          {[
            ['center', `${camera.lat.toFixed(6)}, ${camera.lng.toFixed(6)}`],
            ['zoom', camera.zoom.toFixed(3)],
            ['bearing', camera.bearing.toFixed(2)],
            ['pitch', camera.pitch.toFixed(2)],
            ['zoom range', `${camera.minZoom.toFixed(2)} → ${camera.maxZoom.toFixed(2)}`],
            ['bounds W', camera.west.toFixed(6)],
            ['bounds S', camera.south.toFixed(6)],
            ['bounds E', camera.east.toFixed(6)],
            ['bounds N', camera.north.toFixed(6)],
            ['max bounds', camera.maxBounds],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-20 shrink-0 text-[#8f8f8f]">{label}</dt>
              <dd className="min-w-0 break-all text-[#d4d4d8]">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="text-[#8f8f8f]">Waiting for map…</div>
      )}

      <button
        type="button"
        onClick={copy}
        className="mt-2 w-full border border-[#34343a] px-2 py-1 text-[9px] hover:bg-[#1f1f23]"
      >
        Copy camera JSON
      </button>
    </div>
  );
}
