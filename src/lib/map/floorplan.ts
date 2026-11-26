/**
 * Georeferencing for the Hall C1 floor-plan.
 *
 * The floor-plan is the Figma frame "Frame 1686561279" (node 1729:23400,
 * 818 x 820 px). Its hall outline must sit exactly on the annotated GeoJSON
 * ring around the real building:
 *
 *   1 — west        [110.3759552, -7.7743296]
 *   2 — south       [110.3762449, -7.774517]
 *   3 — east        [110.3765199, -7.7740687]
 *   4 — north       [110.3762821, -7.7739373]
 *   5 — north-west   [110.3760564, -7.7739569]
 *   (6 re-closes the ring on 1)
 *
 * The hall drawing inside the frame is stylised, so a single similarity
 * transform cannot hit every corner. We least-squares fit a projective
 * (homography) transform from the five frame-space hall corners to the five
 * GeoJSON corners — residuals are ~1–4 m, the best any static transform can
 * do for this artwork.
 */

export type Point = [number, number];

/** Annotated hall ring (lng, lat), clockwise, closure included. */
export const GEO_HALL_RING: [number, number][] = [
  [110.3759552, -7.7743296], // 1 — west
  [110.3762449, -7.774517], // 2 — south
  [110.3765199, -7.7740687], // 3 — east
  [110.3762821, -7.7739373], // 4 — north
  [110.3760564, -7.7739569], // 5 — north-west
  [110.3759542, -7.7743301], // closure ≈ 1
];

/** Figma frame size (node 1729:23400). */
export const FRAME_WIDTH = 818;
export const FRAME_HEIGHT = 820;

/**
 * Sharp hall corners in frame coordinates (px). Derived from the hall outline
 * vector (`public/maps/assets/hall-outline.svg`, 675.391 x 408.428 viewBox)
 * placed by the design at left 92.52 / top 0.21 in a 667.786 x 789.359
 * wrapper, rotated -63.71° around a 677.931 x 409.89 box, image inset
 * 0.27% / 0.25% / 0 / 0.12%.
 *
 * Order matches GEO_HALL_RING[0..4]: 1 bottom-left, 2 bottom, 3 right,
 * 4 top, 5 top-left.
 */
export const HALL_FRAME_CORNERS: Point[] = [
  [141.0, 622.37], // 1 — bottom-left
  [454.65, 786.94], // 2 — bottom
  [760.6, 181.91], // 3 — right
  [516.84, 75.64], // 4 — top
  [267.62, 253.57], // 5 — top-left
];

/* ------------------------------------------------------------------ */
/* Web-mercator helpers                                                */
/* ------------------------------------------------------------------ */

function mercatorFromLngLat(lngLat: [number, number]): Point {
  const [lng, lat] = lngLat;
  const x = (lng + 180) / 360;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return [x, y];
}

function lngLatFromMercator(merc: Point): [number, number] {
  const [x, y] = merc;
  return [x * 360 - 180, (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI];
}

/* ------------------------------------------------------------------ */
/* Frame → mercator fitting                                            */
/* ------------------------------------------------------------------ */

type Matrix3 = number[]; // row-major 3x3

function apply(M: Matrix3, p: Point) {
  const w = M[6] * p[0] + M[7] * p[1] + M[8];
  return [(M[0] * p[0] + M[1] * p[1] + M[2]) / w, (M[3] * p[0] + M[4] * p[1] + M[5]) / w];
}

/* ------------------------------------------------------------------ */
/* Frame → world transform                                            */
/* ------------------------------------------------------------------ */

/**
 * How strictly the GeoJSON ring shapes the plan:
 *  - 'affine': rotation + scale + mild shear — hugs the ring corners (~3–5 m),
 *    may stretch the frame ≤ ~10 % along one axis.
 *  - 'similarity': rotation + uniform scale only — Figma proportions 100 %
 *    intact, corners may drift ~6–8 m (invisible once the outline layer is
 *    removed, since nothing on screen references the ring).
 */
export const FIT_MODE: 'affine' | 'similarity' = 'similarity';

/**
 * Manual pose corrections on top of the fit (user-tuned). Rotation is
 * screen-clockwise degrees; scale multiplies the fitted size. Pivoted on the
 * hall centre so the plan stays put while turning/shrinking.
 */
export const POSE_OVERRIDE = {
  rotateDeg: 10,
  scale: 0.85,
  /** Post-fit nudge in metres, map-aligned: [east, north]. */
  offsetMeters: [4, -3] as [number, number],
};

/** Least-squares affine: x' = a·x + b·y + c, y' = d·x + e·y + f. */
function fitAffine(src: Point[], dst: Point[]): Matrix3 | null {
  let Sx = 0, Sy = 0, Sxx = 0, Sxy = 0, Syy = 0;
  const tX = [0, 0, 0];
  const tY = [0, 0, 0];
  for (let i = 0; i < src.length; i++) {
    const [x, y] = src[i];
    const [X, Y] = dst[i];
    Sx += x; Sy += y; Sxx += x * x; Sxy += x * y; Syy += y * y;
    tX[0] += x * X; tX[1] += y * X; tX[2] += X;
    tY[0] += x * Y; tY[1] += y * Y; tY[2] += Y;
  }
  const n = src.length;
  const M = [
    [Sxx, Sxy, Sx],
    [Sxy, Syy, Sy],
    [Sx, Sy, n],
  ];
  const solve = (b: number[]): number[] | null => {
    const A = M.map((row, i) => [...row, b[i]]);
    for (let i = 0; i < 3; i++) {
      let mx = i;
      for (let k = i + 1; k < 3; k++)
        if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k;
      if (Math.abs(A[mx][i]) < 1e-12) return null;
      [A[i], A[mx]] = [A[mx], A[i]];
      for (let k = i + 1; k < 3; k++) {
        const f = A[k][i] / A[i][i];
        for (let j = i; j <= 3; j++) A[k][j] -= f * A[i][j];
      }
    }
    const out = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
      let s = A[i][3];
      for (let j = i + 1; j < 3; j++) s -= A[i][j] * out[j];
      out[i] = s / A[i][i];
    }
    return out;
  };
  const cx = solve(tX);
  const cy = solve(tY);
  if (!cx || !cy) return null;
  return [cx[0], cx[1], cx[2], cy[0], cy[1], cy[2], 0, 0, 1] as Matrix3;
}

/** Least-squares similarity (Kabsch, 2D): rotation + uniform scale only. */
function fitSimilarity(src: Point[], dst: Point[]): Matrix3 | null {
  const n = src.length;
  const ms: Point = [
    src.reduce((s, p) => s + p[0], 0) / n,
    src.reduce((s, p) => s + p[1], 0) / n,
  ];
  const md: Point = [
    dst.reduce((s, p) => s + p[0], 0) / n,
    dst.reduce((s, p) => s + p[1], 0) / n,
  ];
  let a = 0, b = 0, norm = 0;
  for (let i = 0; i < n; i++) {
    const ux = src[i][0] - ms[0];
    const uy = src[i][1] - ms[1];
    const vx = dst[i][0] - md[0];
    const vy = dst[i][1] - md[1];
    a += vx * ux + vy * uy;
    b += vx * uy - vy * ux;
    norm += ux * ux + uy * uy;
  }
  if (norm < 1e-9) return null;
  const scale = Math.hypot(a, b) / norm;
  const theta = Math.atan2(b, a);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const tx = md[0] - scale * (c * ms[0] - s * ms[1]);
  const ty = md[1] - scale * (s * ms[0] + c * ms[1]);
  return [scale * c, -scale * s, tx, scale * s, scale * c, ty, 0, 0, 1] as Matrix3;
}

const ringMercator = GEO_HALL_RING.slice(0, 5).map(mercatorFromLngLat);

const baseFit =
  (FIT_MODE === 'similarity'
    ? fitSimilarity(HALL_FRAME_CORNERS, ringMercator)
    : fitAffine(HALL_FRAME_CORNERS, ringMercator)) ??
  ([1, 0, 0, 0, 1, 0, 0, 0, 1] as Matrix3);

/** Compose a screen-clockwise rotation + uniform scale about the hall centre. */
function applyPoseOverride(M: Matrix3): Matrix3 {
  const th = (POSE_OVERRIDE.rotateDeg * Math.PI) / 180;
  const k = POSE_OVERRIDE.scale;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const pivot = apply(M, [FRAME_WIDTH / 2, FRAME_HEIGHT / 2]);
  const a = M[0], b = M[1], d = M[3], e = M[4];
  const dx = M[2] - pivot[0];
  const dy = M[5] - pivot[1];
  // Map-aligned nudge (metres → mercator units).
  const kMerc = 1 / (2 * Math.PI * 6378137);
  return [
    k * (c * a - s * d),
    k * (c * b - s * e),
    k * (c * dx - s * dy) + pivot[0] + POSE_OVERRIDE.offsetMeters[0] * kMerc,
    k * (s * a + c * d),
    k * (s * b + c * e),
    k * (s * dx + c * dy) + pivot[1] + POSE_OVERRIDE.offsetMeters[1] * kMerc,
    0,
    0,
    1,
  ] as Matrix3;
}

const FRAME_TO_MERCATOR = applyPoseOverride(baseFit);

/** Map a point in Figma-frame pixels to [lng, lat]. */
export function frameToLngLat(p: Point): [number, number] {
  const merc = apply(FRAME_TO_MERCATOR, p);
  return lngLatFromMercator([merc[0], merc[1]]);
}

/** Corners of the frame in [lng, lat] — anchors for the DOM overlay warp. */
export const FRAME_ANCHOR_LNGLATS: [number, number][] = (
  [
    [0, 0],
    [FRAME_WIDTH, 0],
    [FRAME_WIDTH, FRAME_HEIGHT],
    [0, FRAME_HEIGHT],
  ] as Point[]
).map(frameToLngLat);

/** Frame-space anchor points, same order as FRAME_ANCHOR_LNGLATS. */
export const FRAME_ANCHOR_POINTS: Point[] = [
  [0, 0],
  [FRAME_WIDTH, 0],
  [FRAME_WIDTH, FRAME_HEIGHT],
  [0, FRAME_HEIGHT],
];

const HALL_LNGLATS = HALL_FRAME_CORNERS.map(frameToLngLat);

/** Bounding box of the hall footprint — used for the initial fitBounds. */
export const HALL_BOUNDS: [[number, number], [number, number]] = [
  [
    Math.min(...HALL_LNGLATS.map((p) => p[0])),
    Math.min(...HALL_LNGLATS.map((p) => p[1])),
  ],
  [
    Math.max(...HALL_LNGLATS.map((p) => p[0])),
    Math.max(...HALL_LNGLATS.map((p) => p[1])),
  ],
];

/** Hard camera pan limit: the hall plus a short walk of surrounding context.
 *  Keeps the building on screen without exposing the whole campus. */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [HALL_BOUNDS[0][0] - 0.0012, HALL_BOUNDS[0][1] - 0.0009],
  [HALL_BOUNDS[1][0] + 0.0012, HALL_BOUNDS[1][1] + 0.0009],
];

/** Second-floor walk-in layout (Figma 2136:22531 / 2136:22594 / 2136:22608).
 *  Everything is in the same 818×820 frame as the career-expo plan so the
 *  existing map warp can carry it; tweak it from the DEV 2F panel. */
export type WalkIn2FRoom = {
  id: string;
  left: number;
  top: number;
  w: number;
  h: number;
  rotate: number;
};

export type WalkIn2FDecor = {
  id: string;
  label: string;
  src: string;
  left: number;
  top: number;
  w: number;
  h: number;
  rotate: number;
};

export type WalkIn2FConfig = {
  hull: { left: number; top: number; w: number; h: number; rotate: number };
  content: { left: number; top: number; scale: number };
  rooms: WalkIn2FRoom[];
  signs: {
    id: 'entrance' | 'exit';
    left: number;
    top: number;
    w: number;
    h: number;
    rotate: number;
  }[];
  decor?: WalkIn2FDecor[];
};

const walkInRoomSize = 71.6489;

export const WALKIN_2F: WalkIn2FConfig = {
  hull: { left: 20.1, top: 83.6, w: 798, h: 814, rotate: -5 },
  content: { left: 225, top: 140, scale: 1 },
  rooms: [
    { id: 'F1', left: 81.5, top: -18.5, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F2', left: 32.4, top: 48.1, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F3', left: -69.4, top: 207.3, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F4', left: -115.6, top: 275.2, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F5', left: 27.9, top: 350.1, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F6', left: 77, top: 283.6, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F7', left: 124.6, top: 216.9, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F8', left: 170.9, top: 151.6, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F9', left: 219.9, top: 85.1, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
    { id: 'F10', left: 265.9, top: 17.1, w: walkInRoomSize, h: walkInRoomSize, rotate: 35 },
  ],
  signs: [
    { id: 'exit', left: 354, top: -10.1, w: 96, h: 44, rotate: -20 },
    { id: 'entrance', left: 81.2, top: 161.1, w: 46, h: 150, rotate: 35 },
  ],
  decor: [
    {
      id: 'decor-ugm-art',
      label: 'UGM ICD artwork',
      src: '/maps/assets/ugm-icd-art.svg',
      left: -43.6,
      top: 81.8,
      w: 210,
      h: 52.5,
      rotate: 0,
    },
    {
      id: 'decor-door-exit',
      label: 'Exit door',
      src: '/maps/assets/door-glyph-2086-22758.svg',
      left: 395.3,
      top: 38.5,
      w: 28,
      h: 31,
      rotate: 20,
    },
    {
      id: 'decor-door-entrance',
      label: 'Entrance door',
      src: '/maps/assets/door-glyph-2086-22757.svg',
      left: 132.2,
      top: 252.3,
      w: 18,
      h: 35,
      rotate: 35,
    },
    {
      id: 'decor-arrow-entrance',
      label: 'Entrance arrow',
      src: '/maps/assets/arrow-yellow-2087-22763.svg',
      left: 14.2,
      top: 177.6,
      w: 58,
      h: 28,
      rotate: 20,
    },
  ],
};

/**
 * Axis-aligned frame-space bounding box of a 2F walk-in room: the composed
 * room.rotate (about the room centre) + hull.rotate (about the hull centre)
 * transform, in the same 818×820 frame px as the career-expo booth boxes.
 * Used for the click-tooltip anchor and the camera fly-to — the exact roles
 * BOOTH_SHAPES boxes play downstairs.
 */
export function walkInRoomFrameBox(
  config: WalkIn2FConfig,
  roomId: string,
): { left: number; top: number; w: number; h: number } | null {
  const room = config.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  const { content, hull } = config;
  const rw = room.w * content.scale;
  const rh = room.h * content.scale;
  const lx = content.left + room.left * content.scale;
  const ly = content.top + room.top * content.scale;
  // CSS rotate in a y-down space: x' = dx·cos − dy·sin, y' = dx·sin + dy·cos.
  const rcx = lx + rw / 2;
  const rcy = ly + rh / 2;
  const ra = (room.rotate * Math.PI) / 180;
  const rc = Math.cos(ra);
  const rs = Math.sin(ra);
  const hcx = hull.w / 2;
  const hcy = hull.h / 2;
  const ha = (hull.rotate * Math.PI) / 180;
  const hc = Math.cos(ha);
  const hs = Math.sin(ha);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [cx, cy] of [
    [0, 0],
    [rw, 0],
    [rw, rh],
    [0, rh],
  ]) {
    const dx = lx + cx - rcx;
    const dy = ly + cy - rcy;
    const x1 = rcx + dx * rc - dy * rs;
    const y1 = rcy + dx * rs + dy * rc;
    const ex = x1 - hcx;
    const ey = y1 - hcy;
    const x2 = hcx + ex * hc - ey * hs + hull.left;
    const y2 = hcy + ex * hs + ey * hc + hull.top;
    if (x2 < minX) minX = x2;
    if (x2 > maxX) maxX = x2;
    if (y2 < minY) minY = y2;
    if (y2 > maxY) maxY = y2;
  }
  return { left: minX, top: minY, w: maxX - minX, h: maxY - minY };
}


export const HALL_CENTER: [number, number] = [110.376329, -7.774125];
/** Desktop hall-card focus: the framing measured when clicking the venue
 *  card on desktop. */
export const DESKTOP_FOCUS_CENTER: [number, number] = [110.376266, -7.774241];

/** Hall footprint as a GeoJSON polygon (mercator-projected frame corners). */
export const HALL_GEOJSON = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[...HALL_LNGLATS, HALL_LNGLATS[0]]],
  },
};

/* ------------------------------------------------------------------ */
/* Booth shapes (from the Figma frame, exact px)                        */
/* ------------------------------------------------------------------ */

export type BoothShape = {
  /** booths.json id */
  id: string;
  /** label rendered on the plan (booth code) */
  code: string;
  /** wrapper box in frame px (already the rotated bounding box) */
  left: number;
  top: number;
  w: number;
  h: number;
  /** rotation applied to the inner box */
  rotate: number;
  innerW: number;
  innerH: number;
  bg: string;
  borderWidth: number;
  /** optional border ink; defaults to the dark hairline used by C/E */
  borderColor?: string;
  padding: number;
  labelSize: number;
  labelTracking: number;
  /** extra rotation for the label glyph (A/B: 91.5, E1–E5: 180) */
  labelRotate?: number;
};

const WHITE = '#ffffff';

export const BOOTH_SHAPES: BoothShape[] = [
  // C zone — teal, rotated -71.71°, thick white border
  {
    id: 'c1', code: 'C1', left: 270.4, top: 294.5, w: 75.863, h: 59.033, rotate: -71.71,
    innerW: 40.148, innerH: 66.629, bg: '#5b7f3a', borderWidth: 3.106, padding: 6.37,
    labelSize: 19.637, labelTracking: -1.571,
  },
  {
    id: 'c2', code: 'C2', left: 255, top: 346.3, w: 76.132, h: 59.844, rotate: -71.71,
    innerW: 41.002, innerH: 66.629, bg: '#5b7f3a', borderWidth: 3.106, padding: 6.37,
    labelSize: 19.637, labelTracking: -1.571,
  },
  {
    id: 'c3', code: 'C3', left: 239.6, top: 398, w: 75.863, h: 59.033, rotate: -71.71,
    innerW: 40.148, innerH: 66.629, bg: '#5b7f3a', borderWidth: 3.106, padding: 6.37,
    labelSize: 19.637, labelTracking: -1.571,
  },
  {
    id: 'c4', code: 'C4', left: 210.1, top: 495.9, w: 75.863, h: 59.033, rotate: -71.71,
    innerW: 40.148, innerH: 66.629, bg: '#5b7f3a', borderWidth: 3.106, padding: 6.37,
    labelSize: 19.637, labelTracking: -1.571,
  },
  {
    id: 'c5', code: 'C5', left: 195.4, top: 542.2, w: 75.863, h: 59.033, rotate: -71.71,
    innerW: 40.148, innerH: 66.629, bg: '#5b7f3a', borderWidth: 3.106, padding: 6.37,
    labelSize: 19.637, labelTracking: -1.571,
  },
  {
    id: 'c6', code: 'C6', left: 180.6, top: 588.4, w: 76.132, h: 59.844, rotate: -71.71,
    innerW: 41.002, innerH: 66.629, bg: '#5b7f3a', borderWidth: 3.106, padding: 6.37,
    labelSize: 19.637, labelTracking: -1.571,
  },
  // Main stage booths — navy
  {
    id: 'b', code: 'B', left: 364, top: 458.5, w: 75.151, h: 91.966, rotate: -71.71,
    innerW: 79.369, innerH: 52.912, bg: '#1f7f79', borderWidth: 1.274, padding: 6.37,
    labelSize: 31.104, labelTracking: -2.4883, labelRotate: 91.5,
  },
  // D zone — pink slabs, 0.6× the codegen (tighter than C, per the reference)
  {
    id: 'd1', code: 'D1', left: 222, top: 192.7, w: 70, h: 80, rotate: -34.69,
    innerW: 80.5, innerH: 26, bg: '#ef6999', borderWidth: 1.6,
    borderColor: '#ffffff', padding: 2,
    labelSize: 16, labelTracking: -1.3,
  },
  {
    id: 'd2', code: 'D2', left: 178.4, top: 300.3, w: 26, h: 80, rotate: -70,
    innerW: 79.3, innerH: 26, bg: '#ef6999', borderWidth: 1.6,
    borderColor: '#ffffff', padding: 2,
    labelSize: 16, labelTracking: -1.3,
  },
  {
    id: 'd3', code: 'D3', left: 123.1, top: 469.8, w: 26, h: 75, rotate: -70,
    innerW: 75.1, innerH: 26, bg: '#ef6999', borderWidth: 1.6,
    borderColor: '#ffffff', padding: 2,
    labelSize: 16, labelTracking: -1.3,
  },
  {
    id: 'd4', code: 'D4', left: 94.7, top: 543.5, w: 26, h: 80, rotate: -70,
    innerW: 79.3, innerH: 26, bg: '#ef6999', borderWidth: 1.6,
    borderColor: '#ffffff', padding: 2,
    labelSize: 16, labelTracking: -1.3,
  },
  // E zone, west row — small boxes, labels flipped
  {
    id: 'e2', code: 'E2', left: 183.4, top: 684.2, w: 48.08, h: 42.347, rotate: -151.93,
    innerW: 40.38, innerH: 26.456, bg: '#f0862a', borderWidth: 1.274, padding: 6.37,
    labelSize: 16.261, labelTracking: -1.3009, labelRotate: 180,
  },
  {
    id: 'e3', code: 'E3', left: 223.2, top: 705.1, w: 48.08, h: 42.347, rotate: -151.93,
    innerW: 40.38, innerH: 26.456, bg: '#f0862a', borderWidth: 1.274, padding: 6.37,
    labelSize: 16.261, labelTracking: -1.3009, labelRotate: 180,
  },
  {
    id: 'e4', code: 'E4', left: 281.5, top: 731.5, w: 48.08, h: 42.345, rotate: -151.93,
    innerW: 40.38, innerH: 26.456, bg: '#f0862a', borderWidth: 1.274, padding: 6.37,
    labelSize: 16.261, labelTracking: -1.3009, labelRotate: 180,
  },
  {
    id: 'e5', code: 'E5', left: 320.1, top: 753, w: 48.08, h: 42.345, rotate: -151.93,
    innerW: 40.38, innerH: 26.456, bg: '#f0862a', borderWidth: 1.274, padding: 6.37,
    labelSize: 16.261, labelTracking: -1.3009, labelRotate: 180,
  },
  // E zone, east row
  {
    id: 'e6', code: 'E6', left: 384.1, top: 730, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e7', code: 'E7', left: 404, top: 691, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e8', code: 'E8', left: 423.9, top: 652, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e9', code: 'E9', left: 443.8, top: 613, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e10', code: 'E10', left: 463.7, top: 574, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e11', code: 'E11', left: 483.6, top: 535, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e12', code: 'E12', left: 503.5, top: 496, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e13', code: 'E13', left: 523.4, top: 457.1, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
  {
    id: 'e14', code: 'E14', left: 543.4, top: 418.1, w: 45.079, h: 51.754, rotate: -63.31,
    innerW: 43.573, innerH: 28.548, bg: '#f0862a', borderWidth: 1.612, padding: 8.062,
    labelSize: 20.578, labelTracking: -1.6462,
  },
];

export { WHITE as BOOTH_BORDER_WHITE };

/* ------------------------------------------------------------------ */
/* Booth hit-testing                                                   */
/* ------------------------------------------------------------------ */

/**
 * Per-booth constants for the pointermove/click hit-test. The visible chip is
 * the inner box, centred in its rotated wrapper; the hit area keeps the old
 * 2px forgiveness. cos/sin are the inverse rotation used to project a frame
 * point into the booth's local axes, precomputed once so hovering never calls
 * trig.
 */
export type BoothHitTarget = {
  id: string;
  cx: number;
  cy: number;
  cos: number;
  sin: number;
  halfW: number;
  halfH: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const BOOTH_HIT_PAD = 2;
/** Broad-phase slack: never reject a boundary point the exact test accepts. */
const BOOTH_HIT_AABB_EPSILON = 0.001;

export const BOOTH_HIT_TARGETS: BoothHitTarget[] = BOOTH_SHAPES.map((s) => {
  const a = (-s.rotate * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const halfW = s.innerW / 2 + BOOTH_HIT_PAD;
  const halfH = s.innerH / 2 + BOOTH_HIT_PAD;
  const cx = s.left + s.w / 2;
  const cy = s.top + s.h / 2;
  const halfX = Math.abs(halfW * cos) + Math.abs(halfH * sin);
  const halfY = Math.abs(halfW * sin) + Math.abs(halfH * cos);
  return {
    id: s.id,
    cx,
    cy,
    cos,
    sin,
    halfW,
    halfH,
    minX: cx - halfX - BOOTH_HIT_AABB_EPSILON,
    maxX: cx + halfX + BOOTH_HIT_AABB_EPSILON,
    minY: cy - halfY - BOOTH_HIT_AABB_EPSILON,
    maxY: cy + halfY + BOOTH_HIT_AABB_EPSILON,
  };
});

/**
 * Hit-test a frame-space point against the rotated booth boxes (first match
 * wins, same order as BOOTH_SHAPES). The AABB broad phase rejects the common
 * miss without trig; the exact rotated-box test stays identical to the old
 * per-move implementation.
 */
export function boothAtFramePoint(p: { x: number; y: number }): string | null {
  for (const target of BOOTH_HIT_TARGETS) {
    if (
      p.x < target.minX ||
      p.x > target.maxX ||
      p.y < target.minY ||
      p.y > target.maxY
    ) {
      continue;
    }
    const dx = p.x - target.cx;
    const dy = p.y - target.cy;
    const rx = dx * target.cos - dy * target.sin;
    const ry = dx * target.sin + dy * target.cos;
    if (Math.abs(rx) <= target.halfW && Math.abs(ry) <= target.halfH) {
      return target.id;
    }
  }
  return null;
}

/**
 * Static SVG fixtures on the plan (toilet, mushola, panggung platform,
 * horseshoe island, seat grid, entrance arrows). Positions are frame px and
 * were derived from Figma node 2063:22749 through the same hull transform as
 * `hall-pillars.svg`; the geometry editor can nudge/rotate them and export
 * replacements.
 */
export type PlanSprite = {
  id: string;
  label: string;
  src: string;
  left: number;
  top: number;
  w: number;
  h: number;
  rotate: number;
};

export const PLAN_SPRITES: PlanSprite[] = [
  {
    id: 'toilet',
    label: 'Toilet',
    src: '/maps/assets/toilet.svg',
    left: 396.2,
    top: 150.4,
    w: 71.4,
    h: 25.2,
    rotate: -41.04,
  },
  {
    id: 'mushola',
    label: 'Mushola',
    src: '/maps/assets/stage-seats.svg',
    left: 445.3,
    top: 174.8,
    w: 29.02,
    h: 25.2,
    rotate: -41.04,
  },
  {
    id: 'panggung-platform',
    label: 'Panggung platform',
    src: '/maps/assets/panggung.svg',
    left: 527.7,
    top: 189.2,
    w: 45.21,
    h: 106.05,
    rotate: -59.37,
  },
  {
    id: 'horseshoe',
    label: 'Horseshoe / tapal kuda',
    src: '/maps/assets/horseshoe.svg',
    left: 575.9,
    top: 115.4,
    w: 70.62,
    h: 143.7,
    rotate: -69.09,
  },
  {
    id: 'seats',
    label: 'Seat grid',
    src: '/maps/assets/seats.svg',
    left: 432.6,
    top: 259.5,
    w: 132.939,
    h: 137.9,
    rotate: 0,
  },
  {
    id: 'entrance-arrow',
    label: 'Entrance arrow',
    src: '/maps/assets/arrow-entrance.svg',
    left: 406.6,
    top: 109,
    w: 119.749,
    h: 129.844,
    rotate: -71.71,
  },
  {
    id: 'door-2086-22758',
    label: 'Door 2086:22758',
    src: '/maps/assets/door-glyph-2086-22758.svg',
    left: 297.8,
    top: 157.6,
    w: 32.7,
    h: 35.95,
    rotate: 20,
  },
  {
    id: 'door-2086-22757',
    label: 'Door 2086:22757',
    src: '/maps/assets/door-glyph-2086-22757.svg',
    left: 143.3,
    top: 409.3,
    w: 16.85,
    h: 33.08,
    rotate: 20,
  },
  {
    id: 'yellow-arrow-1',
    label: 'Yellow arrow 1 (2087:22763)',
    src: '/maps/assets/arrow-yellow-2087-22763.svg',
    left: 262.2,
    top: 121.1,
    w: 60.8,
    h: 28.8,
    rotate: -118.1,
  },
  {
    id: 'yellow-arrow-2',
    label: 'Yellow arrow 2 (2087:22763)',
    src: '/maps/assets/arrow-yellow-2087-22763.svg',
    left: 75.2,
    top: 390.6,
    w: 62,
    h: 31.3,
    rotate: 20,
  },
  {
    id: 'ugm-icd-map-art',
    label: 'UGM ICD map art (Figma 2115:22565)',
    src: '/maps/assets/ugm-icd-art.svg',
    left: -256.3,
    top: 185.2,
    w: 337.2,
    h: 109.3,
    rotate: 0,
  },
];

/** Facility anchors in frame space — used for map focus, the selection pulse
 *  and the registration tooltip. Colors mirror the facility accents. */
export const FACILITY_FRAME_POINTS: Record<
  string,
  { point: Point; color: string }
> = {
  entrance: { point: [55.7, 384.8], color: '#0fae4a' },
  registration: { point: [70.4, 559.8], color: '#e5484d' },
  photobooth: { point: [226.3, 204.1], color: '#ff2d6f' },
  'photo-wall': { point: [301.1, 68.1], color: '#0e7490' },
  panggung: { point: [550.6, 243.1], color: '#d4d4d8' },
  toilet: { point: [431.9, 163.0], color: '#5b8def' },
  mushola: { point: [459.8, 187.4], color: '#4fc3a1' },
  'pusat-bantuan': { point: [479.8, 207.4], color: '#f0c71d' },
};

/** Polygon annotations seeded in the geometry editor (editor-only overlays). */
export const PLAN_ANNOTATIONS: {
  id: string;
  name: string;
  color: string;
  points: [number, number][];
}[] = [
  {
    id: 'toilet',
    name: 'Toilet',
    color: '#f0c71d',
    points: [
      [393.9, 178.4],
      [453.9, 235.3],
      [547.7, 143],
      [467.7, 109.2],
    ],
  },
  {
    id: 'seat',
    name: 'Seat',
    color: '#f0c71d',
    points: [
      [487.7, 255.3],
      [566.2, 306.1],
      [509.3, 393.8],
      [432.3, 346.1],
    ],
  },
];


/** Booth id → [lng, lat] at the booth centre (for fly-to / markers). */
export const BOOTH_LNGLATS: Record<string, [number, number]> = Object.fromEntries(
  BOOTH_SHAPES.map((s) => [s.id, frameToLngLat([s.left + s.w / 2, s.top + s.h / 2])]),
);

/* ------------------------------------------------------------------ */
/* Seat-marker dots (80 small rotated squares from the Figma frame)    */
/* ------------------------------------------------------------------ */

export const SEAT_DOTS: Point[] = [
  [597.81, 314.95], [591.02, 310.77], [584.23, 306.59], [577.44, 302.4], [570.65, 298.22],
  [590.88, 326.21], [584.09, 322.03], [577.29, 317.84], [570.5, 313.66], [563.71, 309.48],
  [583.94, 337.47], [577.15, 333.29], [570.36, 329.11], [563.57, 324.93], [556.78, 320.75],
  [577.01, 348.74], [570.21, 344.56], [563.42, 340.38], [556.63, 336.19], [549.84, 332.01],
  [526.87, 334.11], [520.08, 329.93], [513.3, 325.75], [506.5, 321.56], [499.71, 317.38],
  [519.94, 345.37], [513.15, 341.19], [506.36, 337.0], [499.57, 332.82], [492.78, 328.64],
  [513.01, 356.63], [506.22, 352.45], [499.43, 348.27], [492.64, 344.09], [485.84, 339.91],
  [506.07, 367.9], [499.28, 363.71], [492.49, 359.54], [485.7, 355.35], [478.91, 351.17],
  [568.88, 360.11], [562.09, 355.93], [555.3, 351.75], [548.51, 347.56], [541.72, 343.38],
  [561.95, 371.37], [555.16, 367.19], [548.36, 363.0], [541.57, 358.82], [534.78, 354.64],
  [555.01, 382.63], [548.22, 378.45], [541.43, 374.27], [534.64, 370.09], [527.85, 365.91],
  [548.08, 393.9], [541.28, 389.71], [534.49, 385.54], [527.7, 381.35], [520.91, 377.17],
  [555.88, 286.96], [549.08, 282.78], [542.29, 278.59], [535.5, 274.41], [528.71, 270.23],
  [548.94, 298.22], [542.15, 294.03], [535.36, 289.85], [528.56, 285.67], [521.77, 281.49],
  [542.0, 309.48], [535.21, 305.3], [528.42, 301.11], [521.63, 296.93], [514.84, 292.75],
  [535.06, 320.74], [528.27, 316.56], [521.48, 312.38], [514.69, 308.19], [507.9, 304.01],
];
