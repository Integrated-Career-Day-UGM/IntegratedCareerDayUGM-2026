import type { CSSProperties } from 'react';

/**
 * Baked placement for every tunable Sparky / profile part, keyed by the exact
 * `data-layout-tune` id. Tuned in the dev layout panel ("Copy Sparky"); the
 * tuner seeds its sliders from this same object, so opening the panel never
 * jumps the art.
 */
export type TipPlacement = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  z: number;
};

export const LAYOUT_PLACEMENT: Record<string, TipPlacement> = {
  'sparky-tip-career-expo': { x: -100, y: -70, rotate: 15, scale: 0.9, z: 0 },
  'sparky-tip-career-expo-dialog': { x: 105, y: 30, rotate: 0, scale: 1, z: 0 },
  'sparky-tip-career-expo-name': { x: 90, y: -40, rotate: 0, scale: 1, z: 0 },
  'sparky-tip-career-expo-body': { x: 0, y: 0, rotate: 0, scale: 1, z: 0 },
  'sparky-tip-career-expo-text': { x: 10, y: 15, rotate: -5, scale: 0.91, z: 0 },
  'sparky-tip-parking': { x: -100, y: -103, rotate: 12, scale: 0.86, z: 0 },
  'sparky-tip-parking-dialog': { x: 105, y: 30, rotate: 0, scale: 1, z: 0 },
  'sparky-tip-parking-name': { x: 90, y: -40, rotate: 0, scale: 1, z: 0 },
  'sparky-tip-parking-body': { x: 0, y: 0, rotate: 0, scale: 1, z: 0 },
  'sparky-tip-parking-text': { x: 0, y: 20, rotate: -5, scale: 0.91, z: 0 },
  'profile-title': { x: 0, y: 0, rotate: -1.2, scale: 1.18, z: 0 },
  'profile-avatar': { x: 0, y: 0, rotate: 0, scale: 1.32, z: 0 },
  'profile-greeting': { x: 10, y: 10, rotate: 0, scale: 1.17, z: 0 },
};

/** Phone-only overrides, merged over the desktop value below 768px. */
export const LAYOUT_PLACEMENT_MOBILE: Record<string, Partial<TipPlacement>> = {
  'profile-greeting': { y: -10, scale: 1.3 },
};

/** Character tilt, counter-clockwise. Applied inside the tunable body so the
 *  panel's rotate control still composes with it. */
export const SPARKY_BODY_ROTATE = -15;

/**
 * Per-instance idle wobble: each bubble gets its own speed, phase and strength
 * (base + base * rand[0.1, 0.8]), so two Sparkys never breathe in sync.
 */
export const randomSparkySkew = () => {
  const duration = 1.6 + Math.random() * 1.4; // 1.6s - 3s per swing
  return {
    duration,
    // Negative delay starts mid-cycle: this is the sine phase offset.
    delay: -Math.random() * duration * 2,
    amp: 1.1 + Math.random() * 0.7,
  };
};

const EMPTY: TipPlacement = { x: 0, y: 0, rotate: 0, scale: 1, z: 0 };

export const placementFor = (id: string): TipPlacement =>
  LAYOUT_PLACEMENT[id] ?? EMPTY;

/** Baked placement as CSS vars; the dev tuner's `[data-lt-tuned]` rule (two
 *  attributes) wins while a target is being tuned. The `-m` vars are the
 *  phone override, consumed by a max-width rule in global.css. */
export const placementVars = (id: string): CSSProperties => {
  const value = placementFor(id);
  const mobile = LAYOUT_PLACEMENT_MOBILE[id];
  return {
    '--tip-x': `${value.x}px`,
    '--tip-y': `${value.y}px`,
    '--tip-rotate': `${value.rotate}deg`,
    '--tip-scale': value.scale,
    ...(mobile?.x !== undefined ? { '--tip-x-m': `${mobile.x}px` } : {}),
    ...(mobile?.y !== undefined ? { '--tip-y-m': `${mobile.y}px` } : {}),
    ...(mobile?.rotate !== undefined
      ? { '--tip-rotate-m': `${mobile.rotate}deg` }
      : {}),
    ...(mobile?.scale !== undefined ? { '--tip-scale-m': mobile.scale } : {}),
    zIndex: value.z > 0 ? value.z : undefined,
  } as CSSProperties;
};

export const sparkyTipDefaults = (targetId: string): TipPlacement | null =>
  LAYOUT_PLACEMENT[targetId] ?? null;
