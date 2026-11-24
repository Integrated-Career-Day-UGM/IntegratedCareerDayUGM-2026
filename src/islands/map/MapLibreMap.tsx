import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MoveUpRight, Crosshair } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import FloorPlanOverlay from './FloorPlanOverlay';
import ZoomButtons from '../../components/map/ZoomButtons';
import MapTooltip from '../../components/map/MapTooltip';
import FacilityTooltip from '../../components/map/FacilityTooltip';
import CompassButton from '../../components/map/CompassButton';
import MapDebugPanel from './MapDebugPanel';
import { ui, getVenue, getTrack } from '../../lib/data';
import { surfaceClasses } from '../../lib/surface-classes';
import { SNAP_PEEK, TAB_RAIL_H } from './MobileBottomSheet';
import {
  BOOTH_LNGLATS,
  BOOTH_SHAPES,
  FACILITY_FRAME_POINTS,
  FRAME_ANCHOR_LNGLATS,
  FRAME_ANCHOR_POINTS,
  HALL_BOUNDS,
  HALL_CENTER,
  DESKTOP_FOCUS_CENTER,
  HALL_GEOJSON,
  frameToLngLat,
} from '../../lib/map/floorplan';
import {
  homographyToMatrix3d,
  invertMatrix3,
  solveHomography,
  transformPoint,
  type Point2D,
} from '../../lib/map/homography';

/**
 * OpenFreeMap dark vector tiles, re-tinted to match the app's granite shell.
 * Free, no API key, no request limits. https://openfreemap.org
 */
const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

/** GIK overview zoom — the entry camera on both breakpoints and the target
 *  of the track-switcher's GIK tab. Tune this one number after previewing
 *  candidates with the DEV GIK tuner (or `__icdMap.easeTo({ zoom: N })`). */
const GIK_ZOOM = 18.3;
const GIK_ZOOM_KEY = 'icd-gik-zoom';

/** DEV: the tuning panel writes a localStorage override so the number can be
 *  previewed across reloads without editing source. Prod always uses the
 *  constant. */
const resolveGikZoom = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const stored = Number(window.localStorage.getItem(GIK_ZOOM_KEY));
    if (Number.isFinite(stored) && stored >= 10 && stored <= 24) return stored;
  }
  return GIK_ZOOM;
};

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const overlayRootRef = useRef<HTMLDivElement>(null);
  /** Current frame→screen homography (updated every rendered frame). */
  const frameToScreenRef = useRef<number[] | null>(null);
  const lastMatrixRef = useRef<string>('');
  const mapRef = useRef<maplibregl.Map | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const lastTipTransformRef = useRef<string>('');
  const positionTooltipRef = useRef<() => void>(() => {});
  const compassNeedleRef = useRef<SVGGElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  // Field selectors, not a whole-store subscription: hoveredBoothId and
  // mapView change at pointer/moveend rate, and a whole-store subscribe
  // re-rendered this island (and every other island) on each — the GC churn
  // that starved MapLibre's render loop and blacked the canvas.
  const setMapView = useMapStore((s) => s.setMapView);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectedFacilityId = useMapStore((s) => s.selectedFacilityId);
  const hoveredBoothId = useMapStore((s) => s.hoveredBoothId);
  const selectedVenueId = useMapStore((s) => s.selectedVenueId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectedTrackId = useMapStore((s) => s.selectedTrackId);
  const gikMode = useMapStore((s) => s.gikMode);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const setGikMode = useMapStore((s) => s.setGikMode);
  const activeBoothId = hoveredBoothId ?? selectedBoothId;

  /** Re-fit the hall into view. Mobile keeps the top chrome and the tray
      clear via asymmetric padding; desktop uses an even margin. */
  const fitHall = useCallback((duration = 600) => {
    const map = mapRef.current;
    if (!map) return;
    // Camera moves that used `padding` leave it PERSISTENTLY set on the map
    // (verified: easeTo padding sticks), and a later fitBounds then computes
    // negative free space and silently aborts — the "disappearing map" bug.
    // Reset it before fitting.
    map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    // Single camera owner: any in-flight easeTo/flyTo is cancelled here so
    // two moves fired back-to-back (booth fly + hall fit) can never race.
    map.stop();
    // The mobile camera branch follows the LAYOUT breakpoint (md, 768px) —
    // same value the chrome uses (§1).
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const box = map.getContainer();
    // Belt-and-braces: fit padding must stay well under half the canvas or
    // MapLibre aborts the fit ("Map cannot fit within canvas").
    const clamp = (want: number, size: number) => Math.min(want, Math.max(24, Math.floor(size / 2) - 24));
    map.fitBounds(HALL_BOUNDS as maplibregl.LngLatBoundsLike, {
      padding: isMobile
        ? {
            top: clamp(158, box.clientHeight),
            bottom: clamp(210, box.clientHeight),
            left: clamp(24, box.clientWidth),
            right: clamp(24, box.clientWidth),
          }
        : 96,
      maxZoom: 20.6,
      duration,
    });
  }, []);

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
  }, [hoveredBoothId, selectedBoothId, selectedFacilityId]);

  // QuickFind / facility markers: bring the facility point into view.
  useEffect(() => {
    if (!mapLoaded || !selectedFacilityId) return;
    const map = mapRef.current;
    if (!map) return;
    const facility = FACILITY_FRAME_POINTS[selectedFacilityId];
    if (!facility) return;
    try {
      const center = frameToLngLat(facility.point);
      map.easeTo({
        center: center as maplibregl.LngLatLike,
        zoom: Math.max(map.getZoom(), 18.1),
        duration: 650,
      });
    } catch (error) {
      console.error('[maplibre] facility focus', error);
    }
  }, [selectedFacilityId, mapLoaded]);

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
      // Entry state (both breakpoints): the GIK overview. Picking a track
      // tab fits the hall instead.
      zoom: resolveGikZoom(),
      // Zoom-out floor just under the overview: any further out and the
      // floor-plan overlay drowns in campus context (user report: zoom ran
      // from 16 down to 4). Raise toward the entry zoom, verified on device.
      minZoom: 15.5,
      maxZoom: 21.5,
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      attributionControl: false,
    });

    mapRef.current = map;
    setMapInstance(map);

    // Clicking the map itself restores the list from a facility selection.
    // Facility markers/tooltips are DOM children above the canvas, so their
    // clicks never reach this handler.
    map.on('click', () => {
      const store = useMapStore.getState();
      if (store.selectedFacilityId) store.selectFacility(null);
    });

    // The Figma splash listens for `icd:map-ready`; the legacy `#map-boot`
    // element is gone, but keep the same idle + 3s fallback signal.
    const revealMapBoot = () => {
      const readyWindow = window as unknown as { __icdMapReady?: boolean };
      if (readyWindow.__icdMapReady) return;
      readyWindow.__icdMapReady = true;
      window.dispatchEvent(new CustomEvent('icd:map-ready'));
      const el = document.getElementById('map-boot');
      if (!el || el.classList.contains('is-ready')) return;
      el.classList.add('is-ready');
      window.setTimeout(() => el.setAttribute('hidden', ''), 550);
    };
    const readyFallback = window.setTimeout(revealMapBoot, 3000);
    map.once('idle', revealMapBoot);
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__icdMap = map;
      // DEV: GIK tuning panel reads the intro target from here.
      (window as unknown as Record<string, unknown>).__icdGik = {
        center: HALL_CENTER,
        zoom: resolveGikZoom(),
      };
      // Black-canvas diagnosis probe: run from the console the moment the
      // map goes black to distinguish camera/GL/tile failure shapes.
      (window as unknown as Record<string, unknown>).__icdMapDebug = () => {
        const canvas = map.getCanvas();
        return {
          canvasInDom: canvas.isConnected,
          canvasPixelSize: [canvas.width, canvas.height],
          containerSize: [
            map.getContainer().clientWidth,
            map.getContainer().clientHeight,
          ],
          zoom: map.getZoom(),
          moving: map.isMoving(),
          layerCount: map.getStyle().layers?.length ?? 0,
        };
      };
    }

    // Never silent: a swallowed MapLibre error (e.g. the fitBounds abort
    // behind the "disappearing map" bug) used to leave the canvas black
    // with no trace. Context loss is logged so GL resets are visible.
    map.on('error', (e) => {
      // eslint-disable-next-line no-console
      console.error('[maplibre]', e.error ?? e);
    });
    map.on('webglcontextlost', (e) => {
      // eslint-disable-next-line no-console
      console.error('[maplibre] WebGL context lost', (e as unknown as { originalEvent?: Event }).originalEvent);
    });
    map.on('webglcontextrestored', () => {
      // eslint-disable-next-line no-console
      console.warn('[maplibre] WebGL context restored');
    });

    // Compass needle: bearing is clockwise from true north, so the needle
    // rotates by -bearing. Imperative DOM write — no React render per frame.
    const syncCompass = () => {
      compassNeedleRef.current?.setAttribute(
        'transform',
        `rotate(${-map.getBearing()} 20 20)`,
      );
    };
    map.on('rotate', syncCompass);
    syncCompass();

    const positionTooltip = () => {
      const el = tooltipRef.current;
      if (!el) return;
      const store = useMapStore.getState();
      const id = store.hoveredBoothId ?? store.selectedBoothId;
      const shape = BOOTH_SHAPES.find((s) => s.id === id);
      const facility =
        !shape && store.selectedFacilityId
          ? FACILITY_FRAME_POINTS[store.selectedFacilityId]
          : null;
      if (!shape && !facility) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        return;
      }
      // Anchor: a booth's top edge or the facility point in frame space.
      const [ax, ay] = shape
        ? [shape.left + shape.w / 2, shape.top]
        : facility!.point;
      const anchor = frameToLngLat([ax, ay]);
      const p = map.project(anchor as maplibregl.LngLatLike);
      // Same crash class as syncOverlay: project() can return an unusable
      // point mid-transition; bail instead of throwing into the render loop.
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
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
      // Defensive guard: while the map is in an unstable state (style
      // transition, tiles/glyphs still loading after a camera move),
      // project() can return undefined or non-finite points. Throwing here
      // kills the `render` callback — MapLibre stops painting and the
      // canvas stays black. Skip the frame instead.
      if (screen.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
        return;
      }
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

    // Entry state is the zoomed-out overview (no initial hall fit). The
    // observer only keeps the canvas glued to the container's real box.
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
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
        paint: { 'fill-color': '#ff2d6f', 'fill-opacity': 0.08 },
      });

      // Collision relief during camera flights: symbol placement dominated
      // render frames while the camera moved (DevTools profile: ~127ms of a
      // 200ms frame in placeCollisionCircles). While flying, symbols skip
      // symbol-vs-symbol collision work; static placement resumes on
      // moveend. The layer list is cached once — flights don't change it.
      const symbolLayerIds = (map.getStyle().layers ?? [])
        .filter((l) => l.type === 'symbol')
        .map((l) => l.id);
      const setCollisionRelief = (on: boolean) => {
        for (const id of symbolLayerIds) {
          if (!map.getLayer(id)) continue;
          map.setLayoutProperty(id, 'icon-ignore-placement', on);
          map.setLayoutProperty(id, 'text-ignore-placement', on);
        }
      };
      map.on('movestart', () => setCollisionRelief(true));
      map.on('moveend', () => setCollisionRelief(false));

      syncOverlay();
      setMapLoaded(true);
    });

    // Keep the DOM floor-plan glued to the map on every rendered frame.
    // Wrapped: an exception escaping this callback used to end the render
    // loop for good (the persistent black map). Now one bad frame logs and
    // the next one paints.
    const safeSyncOverlay = () => {
      try {
        syncOverlay();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[maplibre] syncOverlay failed', err);
      }
    };
    map.on('render', safeSyncOverlay);
    map.on('resize', safeSyncOverlay);

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
      if (id) {
        useMapStore.getState().selectBooth(id);
      } else if (useMapStore.getState().selectedBoothId) {
        // Tapping anywhere that is not a booth deselects (Maps behavior):
        // the tooltip clears, any facility card closes, and the mobile tray
        // lowers back to peek.
        useMapStore.getState().selectBooth(null);
        useMapStore.getState().selectFacility(null);
      }
    });

    return () => {
      window.clearTimeout(readyFallback);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [setMapView, fitHall]);

  /* Fly to the selected booth (from the sidebar, the tray, the URL, or the
     map). On mobile with the detail card open, use a transient `offset` —
     NOT `padding`: easeTo padding sticks to the map and every later
     fitBounds then aborts with "Map cannot fit within canvas" (the
     disappearing-map bug). Offset shifts only this camera move. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedBoothId) return;
    const target = BOOTH_LNGLATS[selectedBoothId];
    if (!target) return;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const detailOpen = useMapStore.getState().sidebarMode === 'detail';
    // Cancel any in-flight camera move first — two overlapping moves are
    // how the camera race (§ black-map) starts.
    map.stop();
    // NOTE: never pass `offset: undefined` — MapLibre's option validation
    // runs Point.convert(undefined) which throws "reading 'x'", killing
    // this effect and unmounting the island (the desktop black-map bug).
    // Only include the key when there is an offset.
    map.easeTo({
      center: target,
      zoom: Math.max(map.getZoom(), 19.4),
      duration: 650,
      ...(isMobile && detailOpen
        ? {
            offset: [
              0,
              Math.min(188, Math.floor(map.getContainer().clientHeight * 0.3)),
            ],
          }
        : {}),
    });
  }, [selectedBoothId, mapLoaded]);

  /* Zoom to the hall whenever the venue state changes — track switcher,
     area dropdown, hall card tap — no matter where it came from. The first
     run after load is skipped (fitToHall already handles the initial fit). */
  const lastAreaKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapLoaded) {
      lastAreaKeyRef.current = null;
      return;
    }
    const key = `${selectedVenueId}|${selectedAreaId}|${selectedTrackId}`;
    if (lastAreaKeyRef.current === null || lastAreaKeyRef.current === key) {
      lastAreaKeyRef.current = key;
      return;
    }
    lastAreaKeyRef.current = key;
    // A selected booth owns the camera (booth fly-to); fitting the hall
    // here would cancel that flight via fitHall's map.stop(). Booth
    // selection can switch area/track since the store change — skip.
    if (useMapStore.getState().selectedBoothId) return;
    fitHall();
  }, [selectedVenueId, selectedAreaId, selectedTrackId, mapLoaded, fitHall]);

  /* GIK camera mode: the overview (zoomed-out event location) is the ENTRY
     state of the map on both breakpoints; picking any track tab returns to
     the hall fit. GIK is owned by the track switcher via the store. Only
     real transitions act — never on mount (the init camera already starts
     in the overview). */
  const prevGikRef = useRef<boolean | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) {
      prevGikRef.current = null;
      return;
    }
    const prev = prevGikRef.current;
    prevGikRef.current = gikMode;
    if (prev === null || prev === gikMode) return;
    if (gikMode) {
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
      map.stop();
      map.easeTo({ center: HALL_CENTER, zoom: resolveGikZoom(), duration: 700 });
    } else {
      // A selected booth owns the camera — its fly-to must not be cancelled
      // by this hall fit (selectBooth leaves GIK mode and switches area in
      // the same commit).
      if (useMapStore.getState().selectedBoothId) return;
      fitHall();
    }
  }, [gikMode, mapLoaded, fitHall]);

  return (
    <div
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

      {/* Mobile map-centre crosshair — lets you read what the camera is
          focused on above the tray. */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center md:hidden"
        aria-hidden="true"
      >
        <div className="relative size-6">
          <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-pink)]" />
          <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-white/60" />
          <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-white/60" />
          <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white/60" />
          <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white/60" />
        </div>
      </div>

      {/* Zoom + Compass controls — right rail, vertically centered (the
          default spot, both breakpoints; keeps top clear for the chrome
          stack and the hall card, bottom clear for the sheet). */}
      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        <ZoomButtons
          onZoomIn={() => mapRef.current?.zoomIn({ duration: 200 })}
          onZoomOut={() => mapRef.current?.zoomOut({ duration: 200 })}
          zoomInLabel={ui.map.zoomInLabel}
          zoomOutLabel={ui.map.zoomOutLabel}
        />
        <CompassButton
          onClick={() => mapRef.current?.rotateTo(0, { duration: 300 })}
          label={ui.map.compassLabel}
          needleRef={compassNeedleRef}
        />
        <button
          type="button"
          onClick={() => fitHall()}
          aria-label={ui.map.recenterLabel}
          title={ui.map.recenterLabel}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#34343a] bg-[#141416] text-white transition-[transform,colors] hover:border-[#4a4a52] active:scale-95"
        >
          <Crosshair size={17} strokeWidth={1.7} />
        </button>
      </div>

      {import.meta.env.DEV && <MapDebugPanel map={mapInstance} />}

      {/* Current venue / tab card. Mobile: hovers just above the tray's
          peek position — derived from the sheet's SNAP_PEEK + tab rail
          constants instead of a hard-coded 172 (§1). Desktop: sits above
          the quick-find bar. Tappable: re-fits the hall into view. */}
      <div
        className="absolute inset-x-3 z-10 flex justify-end bottom-(--hall-card-bottom) md:inset-x-auto md:bottom-[56px] md:left-3 md:justify-start"
        style={{ '--hall-card-bottom': `calc(${SNAP_PEEK}px + ${TAB_RAIL_H}px + 6px)` } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={() => {
            // In the GIK overview the card is the way into the hall: leave
            // the overview and light the venue's Career Expo tab. Outside
            // GIK it stays a plain re-fit.
            if (!gikMode) {
              // Desktop focus lands on the measured framing; mobile keeps
              // the fit-bounds framing that respects the sheet.
              if (window.matchMedia('(max-width: 767px)').matches) fitHall();
              else mapRef.current?.easeTo({ center: DESKTOP_FOCUS_CENTER, duration: 400 });
              return;
            }
            const expoArea = venue?.areas.find((a) => a.trackId === 'career-expo');
            if (expoArea) {
              setSelectedArea(expoArea.id);
            }
            setGikMode(false);
            if (!expoArea) fitHall();
          }}
          // FF Surfaces, fixed level 3 (manually — the element is a button,
          // not a div): opaque surface + honest shadow replaces the
          // translucent bg + backdrop-blur (less glassy, more contrast on
          // the tiles).
          className={`${surfaceClasses(3)} flex cursor-pointer items-center gap-2 rounded-lg border border-[#34343a] px-3 py-2 text-left text-white transition-colors hover:border-[#4a4a52] active:scale-[0.98]`}
        >
          <MoveUpRight size={16} strokeWidth={2.2} className="shrink-0" />
          <div>
            <div className="text-sm leading-tight font-semibold">{areaName}</div>
            <div className="text-[11px] text-zinc-400">{trackLabel}</div>
          </div>
        </button>
      </div>

      {/* Screen-space booth tooltip (upright — outside the plan warp).
          Shows on hover AND on selection, so the clicked venue keeps its
          bubble while the sidebar shows the detail. */}
      {(activeBoothId || selectedFacilityId) && (
        <div
          ref={tooltipRef}
          className="absolute top-0 left-0 z-20"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          {activeBoothId ? (
            <MapTooltip boothId={activeBoothId} x={0} y={0} />
          ) : selectedFacilityId ? (
            <FacilityTooltip facilityId={selectedFacilityId} />
          ) : null}
        </div>
      )}

      {/* Basemap attribution (OSM license) */}
      <div className="pointer-events-none absolute right-3 bottom-0.5 z-10 text-[10px] leading-none text-zinc-500">
        © OpenStreetMap contributors · OpenFreeMap
      </div>
    </div>
  );
}
