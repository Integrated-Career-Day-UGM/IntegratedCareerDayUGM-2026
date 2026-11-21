import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../stores/mapStore';
import CompassButton from '../components/map/CompassButton';
import ZoomButtons from '../components/map/ZoomButtons';
import FullscreenButton from '../components/map/FullscreenButton';
import MapTooltip from '../components/map/MapTooltip';
import FloorPlanOverlay from './FloorPlanOverlay';
import SelectionFrame from '../components/ui/SelectionFrame';
import { ui, getVenue, getTrack } from '../lib/data';
import {
  BOOTH_LNGLATS,
  BOOTH_SHAPES,
  FRAME_ANCHOR_LNGLATS,
  FRAME_ANCHOR_POINTS,
  HALL_BOUNDS,
  HALL_CENTER,
  HALL_GEOJSON,
  frameToLngLat,
} from '../lib/floorplan';
import {
  homographyToMatrix3d,
  invertMatrix3,
  solveHomography,
  transformPoint,
  type Point2D,
} from '../lib/utils/homography';

/**
 * OpenFreeMap dark vector tiles, re-tinted to match the app's granite shell.
 * Free, no API key, no request limits. https://openfreemap.org
 */
const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

/** Granite colour pass over the dark basemap (id → paint overrides). */
const GRANITE_PAINT: Array<[string, Record<string, string>]> = [
  ['background', { 'background-color': '#17181c' }],
  ['building', { 'fill-color': '#24262b', 'fill-outline-color': '#3a3d42' }],
  ['water', { 'fill-color': '#1b2a3a' }],
  ['landuse_park', { 'fill-color': '#1a231d' }],
  ['landcover_wood', { 'fill-color': '#1a231d' }],
  ['landuse_residential', { 'fill-color': '#1d1f24' }],
  ['highway_path', { 'line-color': '#2c2f34' }],
  ['highway_minor', { 'line-color': '#33363b' }],
  ['highway_major_casing', { 'line-color': 'rgba(92,96,102,0.9)' }],
  ['highway_major_inner', { 'line-color': '#4a4e54' }],
  ['highway_motorway_casing', { 'line-color': 'rgba(96,100,106,0.9)' }],
  ['highway_motorway_inner', { 'line-color': '#5b6067' }],
  ['highway_name_other', { 'text-color': '#9aa0a6', 'text-halo-color': '#17181c' }],
];

/**
 * Hit-test a point in floor-plan frame coordinates against the rotated booth
 * boxes (each booth's inner box is centred on its wrapper and rotated by
 * `rotate` degrees).
 */
function boothAtFramePoint(p: Point2D): string | null {
  for (const s of BOOTH_SHAPES) {
    const dx = p.x - (s.left + s.w / 2);
    const dy = p.y - (s.top + s.h / 2);
    const a = (-s.rotate * Math.PI) / 180;
    const rx = dx * Math.cos(a) - dy * Math.sin(a);
    const ry = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(rx) <= s.innerW / 2 + 2 && Math.abs(ry) <= s.innerH / 2 + 2) {
      return s.id;
    }
  }
  return null;
}

export default function MapLibreMap() {
  const stageRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const overlayRootRef = useRef<HTMLDivElement>(null);
  /** Current frame→screen homography (updated every rendered frame). */
  const frameToScreenRef = useRef<number[] | null>(null);
  const lastMatrixRef = useRef<string>('');
  const mapRef = useRef<maplibregl.Map | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const lastTipTransformRef = useRef<string>('');
  const positionTooltipRef = useRef<() => void>(() => {});
  const [mapLoaded, setMapLoaded] = useState(false);
  const { setMapView, selectedBoothId, hoveredBoothId, selectedVenueId, selectedTrackId } =
    useMapStore();
  const activeBoothId = hoveredBoothId ?? selectedBoothId;

  // Current venue / tab card (top-right, SelectionFrame styling).
  const venue = getVenue(selectedVenueId);
  const area = venue?.areas.find((a) => a.trackId === selectedTrackId);
  const areaName = area?.name ?? ui.map.hallLabel;
  const trackLabel = getTrack(selectedTrackId)?.label ?? ui.map.hallSublabel;

  /* Screen-space tooltip: lives OUTSIDE the floor-plan warp so it never
     inherits the plan's skew. Positioned imperatively per rendered frame.
     Shows for the hovered booth AND the selected one (click → bubble stays). */
  useLayoutEffect(() => {
    positionTooltipRef.current();
  }, [hoveredBoothId, selectedBoothId]);

  /* ---------------------------------------------------------------- */
  /* Map init                                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const container = mapContainerRef.current;

    const map = new maplibregl.Map({
      container,
      style: BASE_STYLE_URL,
      center: HALL_CENTER,
      zoom: 17,
      minZoom: 15,
      maxZoom: 21.5,
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      attributionControl: false,
    });

    mapRef.current = map;
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__icdMap = map;
    }

    const positionTooltip = () => {
      const el = tooltipRef.current;
      if (!el) return;
      const store = useMapStore.getState();
      const id = store.hoveredBoothId ?? store.selectedBoothId;
      const shape = BOOTH_SHAPES.find((s) => s.id === id);
      if (!shape) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        return;
      }
      // Anchor: the booth's top edge in frame space → world → screen.
      const anchor = frameToLngLat([shape.left + shape.w / 2, shape.top]);
      const p = map.project(anchor as maplibregl.LngLatLike);
      const transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      if (transform !== lastTipTransformRef.current) {
        lastTipTransformRef.current = transform;
        el.style.transform = transform;
      }
      if (el.style.opacity !== '1') el.style.opacity = '1';
    };
    positionTooltipRef.current = positionTooltip;

    const syncOverlay = () => {
      positionTooltip();
      const root = overlayRootRef.current;
      if (!root) return;
      const screen = FRAME_ANCHOR_LNGLATS.map((lngLat) => map.project(lngLat));
      const h = solveHomography(
        FRAME_ANCHOR_POINTS.map(([x, y]) => ({ x, y }) as Point2D),
        screen.map((p) => ({ x: p.x, y: p.y }) as Point2D),
      );
      if (!h) return;
      frameToScreenRef.current = h;
      const css = homographyToMatrix3d(h);
      // Skip the DOM write when nothing moved — avoids re-render storms
      // from MutationObserver-style consumers (dev toolbar, extensions).
      if (css === lastMatrixRef.current) return;
      lastMatrixRef.current = css;
      root.style.transform = css;
    };

    // Initial fit only once the container actually has layout — MapLibre's
    // stylesheet can override our positioning classes, so we never trust a
    // zero-height measurement.
    let fitted = false;
    const fitToHall = () => {
      if (fitted || container.clientHeight < 100) return;
      fitted = true;
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      map.fitBounds(HALL_BOUNDS as maplibregl.LngLatBoundsLike, {
        padding: isMobile
          ? { top: 64, bottom: 248, left: 24, right: 24 }
          : 96,
        maxZoom: 20.6,
        duration: 0,
      });
    };

    // Keep the canvas glued to the container's real box and re-attempt the
    // initial fit whenever the layout settles.
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      fitToHall();
    });
    resizeObserver.observe(container);

    map.on('load', () => {
      // Granite tint over the dark basemap.
      for (const [layerId, paint] of GRANITE_PAINT) {
        if (!map.getLayer(layerId)) continue;
        for (const [prop, value] of Object.entries(paint)) {
          map.setPaintProperty(layerId, prop, value);
        }
      }

      // Real building footprint under the floor-plan — soft "location aura".
      // The ring is an approximate hand-traced anchor (the footprint is not
      // in OSM), so no crisp outline: it would advertise the 3–5 m slop.
      map.addSource('hall-footprint', { type: 'geojson', data: HALL_GEOJSON });
      map.addLayer({
        id: 'hall-footprint-glow',
        source: 'hall-footprint',
        type: 'fill',
        paint: { 'fill-color': '#ff316b', 'fill-opacity': 0.08 },
      });

      fitToHall();
      syncOverlay();
      setMapLoaded(true);
    });

    // Keep the DOM floor-plan glued to the map on every rendered frame.
    map.on('render', syncOverlay);
    map.on('resize', syncOverlay);

    // Store wiring: push the view state at the END of a gesture instead of
    // on every move frame (the old per-frame write re-rendered islands and
    // starved the main thread — the 5 fps profile).
    map.on('moveend', () => {
      setMapView({
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    /* Booth interaction at the map level: inverse-project the cursor into
       floor-plan frame space and hit-test the rotated booth boxes. The DOM
       booth shapes stay pointer-events:none, so panning from anywhere on the
       map (including on top of booths) always works. */
    const boothFromEvent = (e: maplibregl.MapMouseEvent): string | null => {
      const h = frameToScreenRef.current;
      if (!h) return null;
      const inv = invertMatrix3(h);
      if (!inv) return null;
      const framePoint = transformPoint(inv, { x: e.point.x, y: e.point.y });
      return boothAtFramePoint(framePoint);
    };

    map.on('pointermove', (e) => {
      const id = boothFromEvent(e);
      const store = useMapStore.getState();
      if (id !== store.hoveredBoothId) store.hoverBooth(id);
      map.getCanvas().style.cursor = id ? 'pointer' : '';
    });
    map.on('mouseout', () => {
      useMapStore.getState().hoverBooth(null);
      map.getCanvas().style.cursor = '';
    });
    map.on('click', (e) => {
      // MapLibre suppresses click after a drag, so pan-then-release is safe.
      const id = boothFromEvent(e);
      if (id) useMapStore.getState().selectBooth(id);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [setMapView]);

  /* ---------------------------------------------------------------- */
  /* Fly to the selected booth (from the sidebar, URL, or the map)      */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedBoothId) return;
    const target = BOOTH_LNGLATS[selectedBoothId];
    if (!target) return;
    map.easeTo({
      center: target,
      zoom: Math.max(map.getZoom(), 19.4),
      duration: 650,
    });
  }, [selectedBoothId, mapLoaded]);

  return (
    <div
      ref={stageRef}
      className="map-stage relative h-full w-full overflow-hidden bg-[#09090b]"
      style={{ contain: 'size layout' }}
    >
      {/* Inline positioning: MapLibre's stylesheet ships
          `.maplibregl-map { position: relative; overflow: hidden; }` which
          overrides Tailwind's `.absolute` and collapses the container to 0
          height — clipping the whole canvas and killing hit-testing. Inline
          styles always win. */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Georeferenced floor-plan overlay (warped via CSS matrix3d) */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <FloorPlanOverlay ref={overlayRootRef} />
      </div>

      {/* Zoom + Compass controls */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
        <ZoomButtons
          onZoomIn={() => mapRef.current?.zoomIn({ duration: 200 })}
          onZoomOut={() => mapRef.current?.zoomOut({ duration: 200 })}
          zoomInLabel={ui.map.zoomInLabel}
          zoomOutLabel={ui.map.zoomOutLabel}
        />
        <CompassButton
          onClick={() => mapRef.current?.rotateTo(0, { duration: 300 })}
          label={ui.map.compassLabel}
        />
      </div>

      {/* Current venue / tab card — top-right, Figma selection-frame styling */}
      <div className="absolute top-6 right-3 z-10">
        <SelectionFrame>
          <div className="flex items-center gap-3 bg-[rgba(18,18,21,0.92)] px-4 py-3 text-white shadow-lg backdrop-blur-sm">
            <img
              src="/images/arrow-ne.svg"
              alt=""
              className="h-5 w-5 shrink-0"
              draggable={false}
            />
            <div>
              <div className="text-base leading-tight font-semibold">{areaName}</div>
              <div className="text-xs text-zinc-400">{trackLabel}</div>
            </div>
          </div>
        </SelectionFrame>
      </div>

      {/* Fullscreen — the whole stage (tiles + overlay + controls) */}
      <div className="absolute top-[108px] right-3 z-10">
        <FullscreenButton
          targetRef={stageRef}
          enterLabel={ui.map.fullscreenEnterLabel}
          exitLabel={ui.map.fullscreenExitLabel}
        />
      </div>

      {/* Screen-space booth tooltip (upright — outside the plan warp).
          Shows on hover AND on selection, so the clicked venue keeps its
          bubble while the sidebar shows the detail. */}
      {activeBoothId && (
        <div
          ref={tooltipRef}
          className="absolute top-0 left-0 z-20"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          <MapTooltip boothId={activeBoothId} x={0} y={0} />
        </div>
      )}

      {/* Basemap attribution (OSM license) */}
      <div className="pointer-events-none absolute right-3 bottom-0.5 z-10 text-[10px] leading-none text-zinc-500">
        © OpenStreetMap contributors · OpenFreeMap
      </div>
    </div>
  );
}
