import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MoveUpRight } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import FloorPlanOverlay from './FloorPlanOverlay';
import WalkInFloorPlanOverlay from './WalkInFloorPlanOverlay';
import MapControls from './MapControls';
import MapTooltipHost from './MapTooltipHost';
import FloorWipe from './FloorWipe';
import { DEV_TOOLS } from '../../lib/dev-tools';
import { ui, getVenue, getTrack, walkInSessions } from '../../lib/data';
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
  MAX_BOUNDS,
  DESKTOP_FOCUS_CENTER,
  HALL_GEOJSON,
  frameToLngLat,
  walkInRoomFrameBox,
  boothAtFramePoint,
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
/** iPhone 16 Pro Max reference framing for a clicked venue/list item. */
const MOBILE_FOCUS_CENTER: [number, number] = [110.37614532080488, -7.774196398740571];
const MOBILE_FOCUS_ZOOM = 19.4807;
const MOBILE_FOCUS_OFFSET_RATIO = 0.115;

/** DEV_TOOLS: the tuning panel writes a localStorage override so the number
 *  can be previewed across reloads without editing source. Prod always uses
 *  the constant. */
const resolveGikZoom = () => {
  if (DEV_TOOLS && typeof window !== 'undefined') {
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
  // Field selectors, not a whole-store subscription: mapView changes at
  // moveend rate, and hover is owned by MapTooltipHost. A whole-store
  // subscribe re-rendered this island (and every other island) on each
  // pointer move — the GC churn that starved MapLibre's render loop.
  const setMapView = useMapStore((s) => s.setMapView);
  const selectedBoothId = useMapStore((s) => s.selectedBoothId);
  const selectedFacilityId = useMapStore((s) => s.selectedFacilityId);
  const selectedVenueId = useMapStore((s) => s.selectedVenueId);
  const selectedAreaId = useMapStore((s) => s.selectedAreaId);
  const selectedTrackId = useMapStore((s) => s.selectedTrackId);
  const selectedWalkInRoomId = useMapStore((s) => s.selectedWalkInRoomId);
  const gikMode = useMapStore((s) => s.gikMode);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const setGikMode = useMapStore((s) => s.setGikMode);
  const walkInMode = selectedTrackId === 'walk-in-interview' || selectedAreaId === 'hall-b';
  const walkInConfig = useMapStore((s) => s.walkIn2FConfig);

  useEffect(() => {
    // A floor swap changes the overlay root while the camera is still; force
    // one render so syncOverlay writes the existing matrix to the new root.
    mapRef.current?.triggerRepaint();
  }, [walkInMode]);

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

  /** Mobile venue/list focus reference from the iPhone 16 Pro Max CAM JSON. */
  const focusVenue = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!window.matchMedia('(max-width: 767px)').matches) {
      fitHall();
      return;
    }
    map.stop();
    map.easeTo({
      center: MOBILE_FOCUS_CENTER as maplibregl.LngLatLike,
      zoom: MOBILE_FOCUS_ZOOM,
      duration: 650,
    });
  }, [fitHall]);

  // Current venue / tab card (top-right, SelectionFrame styling).
  const venue = getVenue(selectedVenueId);
  const area = venue?.areas.find((a) => a.trackId === selectedTrackId);
  const areaName = area?.name ?? ui.map.hallLabel;
  const trackLabel = getTrack(selectedTrackId)?.label ?? ui.map.hallSublabel;

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
    const entryZoom = resolveGikZoom();

    const map = new maplibregl.Map({
      container,
      style: BASE_STYLE_URL,
      center: HALL_CENTER,
      // Entry state (both breakpoints): the GIK overview. Picking a track
      // tab fits the hall instead.
      zoom: entryZoom,
      // Camera envelope around the GIK overview: zooming out is capped at
      // 0.8 levels below entry (the hall stays legible), zooming in at 2.2
      // above entry (detail without pixel-mush), and panning is boxed to the
      // hall + one short walk of context. All three are tuned from the DEV
      // CAM readout.
      minZoom: entryZoom - 0.8,
      maxZoom: entryZoom + 2.2,
      maxBounds: MAX_BOUNDS as maplibregl.LngLatBoundsLike,
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    // OpenFreeMap's dark style still points `landcover_wood` at a
    // `wood-pattern` sprite that is no longer in their sprite sheet. We use
    // the flat granite palette instead, so drop the stale pattern before the
    // first wood layer paints (also stops MapLibre's missing-image warning).
    const dropStaleWoodPattern = () => {
      if (map.getLayer('landcover_wood')) {
        map.setPaintProperty('landcover_wood', 'fill-pattern', null);
      }
    };
    map.on('style.load', dropStaleWoodPattern);
    if (map.isStyleLoaded()) dropStaleWoodPattern();

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
    if (DEV_TOOLS) {
      (window as unknown as Record<string, unknown>).__icdMap = map;
      // DEV_TOOLS: GIK tuning panel reads the intro target from here.
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
      // Selected walk-in room: same anchor rule as a booth — the top edge
      // centre of its frame-space box. Only while it is booked on the
      // visible day (the store clears the room otherwise).
      const roomBox =
        !shape && store.selectedWalkInRoomId
          ? walkInSessions.some(
              (s) =>
                s.room === store.selectedWalkInRoomId && s.dayId === store.selectedDayId,
            )
            ? walkInRoomFrameBox(store.walkIn2FConfig, store.selectedWalkInRoomId)
            : null
          : null;
      const facility =
        !shape && !roomBox && store.selectedFacilityId
          ? FACILITY_FRAME_POINTS[store.selectedFacilityId]
          : null;
      if (!shape && !roomBox && !facility) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        return;
      }
      // Anchor: a booth's top edge, a walk-in room's top edge, or the
      // facility point — all in frame space.
      const [ax, ay] = shape
        ? [shape.left + shape.w / 2, shape.top]
        : roomBox
          ? [roomBox.left + roomBox.w / 2, roomBox.top]
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
      const store = useMapStore.getState();
      // The 2F plan owns its own room hover/tooltip; never hit-test the
      // career-expo booth boxes while it is visible.
      if (
        store.selectedTrackId === 'walk-in-interview' ||
        store.selectedAreaId === 'hall-b'
      ) {
        if (store.hoveredBoothId) store.hoverBooth(null);
        map.getCanvas().style.cursor = '';
        return;
      }
      const id = boothFromEvent(e);
      if (id !== store.hoveredBoothId) store.hoverBooth(id);
      map.getCanvas().style.cursor = id ? 'pointer' : '';
    });
    map.on('mouseout', () => {
      useMapStore.getState().hoverBooth(null);
      map.getCanvas().style.cursor = '';
    });
    map.on('click', (e) => {
      // The second-floor walk-in plan is a separate overlay; never hit-test
      // the career-expo booth shapes while it is active.
      const state = useMapStore.getState();
      if (
        state.selectedTrackId === 'walk-in-interview' ||
        state.selectedAreaId === 'hall-b'
      ) {
        // Tapping the canvas away from a room clears every selection —
        // the tooltip drops and the tray/list returns.
        if (state.selectedBoothId) state.selectBooth(null);
        if (state.selectedFacilityId) state.selectFacility(null);
        if (state.selectedWalkInRoomId) state.selectWalkInRoom(null);
        return;
      }
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
    // iPhone 16 Pro Max reference framing (user-provided CAM JSON): the
    // selected booth sits above the detail tray, clear of the top chrome.
    // The offset is negative because MapLibre places a positive offset BELOW
    // the container centre (verified via map.project).
    const focusOffset = Math.round(map.getContainer().clientHeight * MOBILE_FOCUS_OFFSET_RATIO);
    // NOTE: never pass `offset: undefined` — MapLibre's option validation
    // runs Point.convert(undefined) which throws "reading 'x'", killing
    // this effect and unmounting the island (the desktop black-map bug).
    // Only include the key when there is an offset.
    map.easeTo({
      center: target,
      zoom: Math.max(map.getZoom(), isMobile ? MOBILE_FOCUS_ZOOM : 19.4),
      duration: 650,
      ...(isMobile && detailOpen
        ? {
            offset: [0, -focusOffset],
          }
        : {}),
    });
  }, [selectedBoothId, mapLoaded]);

  /* Fly to the selected 2F walk-in room — same framing rules as the booth
     fly-to above (mobile detail offset included). Single camera owner: the
     hall-fit and GIK effects both yield to a selected room. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedWalkInRoomId) return;
    try {
      const box = walkInRoomFrameBox(
        useMapStore.getState().walkIn2FConfig,
        selectedWalkInRoomId,
      );
      if (!box) return;
      const target = frameToLngLat([box.left + box.w / 2, box.top + box.h / 2]);
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const detailOpen = useMapStore.getState().sidebarMode === 'detail';
      // Cancel any in-flight camera move first (see the booth fly-to).
      map.stop();
      const focusOffset = Math.round(
        map.getContainer().clientHeight * MOBILE_FOCUS_OFFSET_RATIO,
      );
      map.easeTo({
        center: target as maplibregl.LngLatLike,
        zoom: Math.max(map.getZoom(), isMobile ? MOBILE_FOCUS_ZOOM : 19.4),
        duration: 650,
        // Transient offset only — never persistent padding (§ disappearing
        // map). Omitted entirely when there is nothing to shift.
        ...(isMobile && detailOpen
          ? {
              offset: [0, -focusOffset],
            }
          : {}),
      });
    } catch (error) {
      console.error('[maplibre] walk-in room focus', error);
    }
  }, [selectedWalkInRoomId, mapLoaded]);

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
    // A selected booth or walk-in room owns the camera (its fly-to); fitting
    // the hall here would cancel that flight via fitHall's map.stop().
    // Selections can switch area/track since the store change — skip.
    if (
      useMapStore.getState().selectedBoothId ||
      useMapStore.getState().selectedWalkInRoomId
    )
      return;
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
      // A selected booth or walk-in room owns the camera — its fly-to must
      // not be cancelled by this hall fit (selections leave GIK mode and
      // switch area in the same commit).
      if (
        useMapStore.getState().selectedBoothId ||
        useMapStore.getState().selectedWalkInRoomId
      )
        return;
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
        {walkInMode ? (
          <WalkInFloorPlanOverlay ref={overlayRootRef} config={walkInConfig} />
        ) : (
          <FloorPlanOverlay ref={overlayRootRef} />
        )}
      </div>

      {/* Short pixel veil on every map-shell tab/floor swap. */}
      <FloorWipe />

      {/* Mobile map-centre crosshair removed — the hall card + tray already
          communicate the camera target. */}

      {/* Zoom + Compass controls — memoized; hover/selection renders never
          reconcile this subtree. */}
      <MapControls
        mapRef={mapRef}
        compassNeedleRef={compassNeedleRef}
        fitHall={fitHall}
      />

      {/* Current venue / tab card. Mobile: hovers just above the tray's
          peek position — derived from the sheet's SNAP_PEEK + tab rail
          constants instead of a hard-coded 172 (§1). Desktop: sits above
          the quick-find bar. Tappable: re-fits the hall into view. */}
      <div
        data-layout-tune="hall-card"
        className="absolute inset-x-3 z-10 flex justify-end bottom-(--hall-card-bottom) md:inset-x-auto md:bottom-0 md:left-3 md:justify-start"
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
              if (window.matchMedia('(max-width: 767px)').matches) focusVenue();
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
          className={`${surfaceClasses(3)} flex cursor-pointer items-center gap-2 rounded-lg border border-[#34343a] px-3 py-2 text-left text-white transition-colors md:hover:border-[var(--accent-pink)] active:scale-[0.98]`}
        >
          <MoveUpRight size={16} strokeWidth={2.2} className="shrink-0" />
          <div>
            <div className="text-sm leading-tight font-semibold">{areaName}</div>
            <div className="text-[11px] text-zinc-400">{trackLabel}</div>
          </div>
        </button>
      </div>

      {/* Screen-space tooltip host (upright — outside the plan warp).
          Subscribes to hover/selection itself; hovering never re-renders
          this whole map island. */}
      <MapTooltipHost
        tooltipRef={tooltipRef}
        positionTooltipRef={positionTooltipRef}
      />

      {/* Basemap attribution (OSM license) */}
      <div className="pointer-events-none absolute right-3 bottom-0.5 z-10 text-[10px] leading-none text-zinc-500">
        © OpenStreetMap contributors · OpenFreeMap
      </div>
    </div>
  );
}
