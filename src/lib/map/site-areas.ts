import type { Feature, FeatureCollection, Polygon } from 'geojson';

/**
 * Basemap site geometry in real [lng, lat], deliberately independent of the
 * 818×820 floor-plan hull frame: these shapes live on the map, not on the
 * Figma overlay. Edit them from the DEV GEO panel.
 */

export type LngLat = [number, number];

const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG = 111_320;

/** Metres between two lng/lat points (small-area approximation). */
export function ringDistanceMeters(a: LngLat, b: LngLat): number {
  const lat = (((a[1] + b[1]) / 2) * Math.PI) / 180;
  const dx = (a[0] - b[0]) * M_PER_DEG_LNG * Math.cos(lat);
  const dy = (a[1] - b[1]) * M_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/**
 * The source rings are hand-traced and their final vertex misses the first
 * by a few centimetres, so GeoJSON refuses to treat them as closed. Drop
 * consecutive near-duplicates, then snap the last vertex onto the first.
 */
export function snapClosedRing(coords: LngLat[], toleranceMeters = 0.5): LngLat[] {
  const ring: LngLat[] = [];
  for (const point of coords) {
    const last = ring[ring.length - 1];
    if (last && ringDistanceMeters(last, point) <= toleranceMeters) continue;
    ring.push([point[0], point[1]]);
  }
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (ringDistanceMeters(first, last) <= toleranceMeters) ring.pop();
  ring.push([first[0], first[1]]);
  return ring;
}

const polygon = (
  ring: LngLat[],
  properties: Record<string, unknown>,
): Feature<Polygon> => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Polygon', coordinates: [snapClosedRing(ring)] },
});

/* ------------------------------------------------------------------ */
/* NPC buildings (exterior context), excluding the toilet ring          */
/* ------------------------------------------------------------------ */

const NPC_RINGS: LngLat[][] = [
  [
    [110.3760201, -7.7743621],
    [110.3762301, -7.774495],
    [110.3765124, -7.7740716],
    [110.3763242, -7.7739657],
    [110.3761201, -7.7740083],
    [110.3760196, -7.7743623],
  ],
  [
    [110.375885, -7.7741867],
    [110.3758632, -7.7742992],
    [110.3757427, -7.7742957],
    [110.3757338, -7.774139],
  ],
  [
    [110.3758879, -7.7741291],
    [110.3759269, -7.7739798],
    [110.3759499, -7.7739851],
    [110.375911, -7.7741343],
  ],
  [
    [110.3758863, -7.7740709],
    [110.3758728, -7.7741255],
    [110.3758531, -7.774119],
    [110.3758675, -7.7740659],
  ],
  [
    [110.3758144, -7.7738384],
    [110.3759421, -7.7738701],
    [110.3759683, -7.7737741],
    [110.3758846, -7.7737534],
  ],
  [
    [110.3757969, -7.7738531],
    [110.3757642, -7.7738908],
    [110.3757246, -7.7740859],
    [110.3758136, -7.7741105],
    [110.3758257, -7.7740568],
    [110.3757864, -7.7740425],
    [110.3758335, -7.773861],
  ],
];

export const NPC_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: NPC_RINGS.map((ring, index) =>
    polygon(ring, { id: `npc-${index + 1}` }),
  ),
};

/* ------------------------------------------------------------------ */
/* Named site areas                                                     */
/* ------------------------------------------------------------------ */

export type SiteArea = {
  id: 'toilet' | 'vip' | 'parking';
  label: string;
  center: LngLat;
  color: string;
  fillOpacity: number;
  ring: LngLat[];
};

/** Sparky tip anchors (hand-picked GeoJSON points, NOT the area centroids). */
export const SPARKY_EXPO_CENTER: LngLat = [110.3764419, -7.7742694];
export const SPARKY_PARKING_CENTER: LngLat = [110.3754648, -7.7744216];

export const TOILET_CENTER: LngLat = [110.3758667, -7.773959];export const VIP_CENTER: LngLat = [110.3755822, -7.7741375];
export const PARKING_CENTER: LngLat = [110.3754331, -7.7742829];
/** Inside the hall (frame covered) — rendered screen-space so the plan art
 *  never hides it. */
export const CAREER_EXPO_CENTER: LngLat = [110.3763665, -7.7739958];

export const SITE_AREAS: SiteArea[] = [
  {
    id: 'toilet',
    label: 'Toilet',
    center: TOILET_CENTER,
    color: '#5b8def',
    fillOpacity: 0.8,
    ring: [
      [110.3758054, -7.7740339],
      [110.375895, -7.7740594],
      [110.3759395, -7.7738843],
      [110.3758492, -7.7738636],
      [110.3758053, -7.7740339],
    ],
  },
  {
    id: 'vip',
    label: 'VIP Lounge',
    center: VIP_CENTER,
    color: '#3c6136',
    fillOpacity: 0.85,
    ring: [
      [110.3755262, -7.7741538],
      [110.3756094, -7.7741823],
      [110.375646, -7.7740995],
      [110.3755633, -7.7740683],
      [110.3755271, -7.7741529],
    ],
  },
  {
    id: 'parking',
    label: 'Parking',
    center: PARKING_CENTER,
    color: '#ff2d6f',
    fillOpacity: 0.4,
    ring: [
      [110.3753293, -7.7741608],
      [110.3756168, -7.7742792],
      [110.3755684, -7.7744217],
      [110.375246, -7.7743258],
      [110.3753293, -7.7741608],
    ],
  },
];

export const SITE_AREAS_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: SITE_AREAS.map((area) =>
    polygon(area.ring, {
      id: area.id,
      label: area.label,
      color: area.color,
      opacity: area.fillOpacity,
    }),
  ),
};

/** Pin config passed to the props-driven pin layer. */
export const SITE_POINTS = SITE_AREAS.map(({ id, label, center, color }) => ({
  id,
  label,
  center,
  color,
}));
