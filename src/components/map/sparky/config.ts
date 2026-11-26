/**
 * Sparky sprite frame + calibrated desktop config. The debug panel writes the
 * same shape this file exports, so a copied config can replace DEFAULT_CONFIG.
 */
export type LayerId = 'body' | 'pupilLeft' | 'pupilRight' | 'eyelid' | 'brow';

export type LayerOffset = {
  x: number;
  y: number;
  scale: number;
  /** CSS rotate in degrees. */
  rotate: number;
  visible: boolean;
};

export type SparkyConfig = {
  initialOffsets: Record<LayerId, LayerOffset>;
  zIndexOrder: LayerId[];
  maxRadius: number;
  spring: { stiffness: number; damping: number };
  /** Stage nudge under the "Student Center Lt 1" label. */
  stageOffset: { x: number; y: number; rotate: number };
  /** Local stack order vs the label (z-10) and map pins (z-20). */
  stageZIndex: number;
};

/** Matches public/map/sparky/body.png. */
export const SPRITE_WIDTH = 314;
export const SPRITE_HEIGHT = 286;

/** Sclera centres in stage pixels. body.png has no baked scleras. */
export const SCLERA_CENTERS = {
  left: { x: 104, y: 108 },
  right: { x: 194, y: 188 },
} as const;

/** Imported layer origins in stage pixels (each is independently movable). */
export const EYELID = { x: 194, y: 184 } as const;
export const BROW = { x: 197, y: 140 } as const;

export const DEFAULT_CONFIG: SparkyConfig = {
  initialOffsets: {
    body: { x: 68, y: 40, scale: 0.75, rotate: 12, visible: true },
    pupilLeft: { x: -54, y: -54, scale: 0.35, rotate: 0, visible: true },
    pupilRight: { x: -109, y: -137, scale: 0.35, rotate: 0, visible: true },
    eyelid: { x: -50, y: -50, scale: 0.35, rotate: -18, visible: true },
    brow: { x: -38, y: -38, scale: 0.35, rotate: -9, visible: true },
  },
  zIndexOrder: ['body', 'pupilLeft', 'pupilRight', 'eyelid', 'brow'],
  maxRadius: 14,
  spring: { stiffness: 220, damping: 22 },
  stageOffset: { x: 0, y: 0, rotate: 0 },
  stageZIndex: 0,
};

export const LAYER_LABELS: Record<LayerId, string> = {
  body: 'Body',
  pupilLeft: 'Pupil left',
  pupilRight: 'Pupil right',
  eyelid: 'Eyelid',
  brow: 'Brow',
};
