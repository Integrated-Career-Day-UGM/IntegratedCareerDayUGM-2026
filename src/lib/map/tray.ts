/**
 * Visual viewport height. On iOS Safari the keyboard and the collapsing
 * address bar shrink the visual viewport but not `innerHeight`, so every
 * tray detent must be measured against this instead.
 */
export function trayViewportHeight(): number {
  const viewport = typeof window === 'undefined' ? null : window.visualViewport;
  return viewport ? Math.round(viewport.height) : window.innerHeight;
}

/** Resting height of the detail card: 40% vh, min 240, never above half. */
export function trayDetailTarget(viewportH = trayViewportHeight()): number {
  return Math.min(
    Math.max(240, Math.round(viewportH * 0.4)),
    Math.max(240, Math.round(viewportH * 0.5)),
  );
}

/**
 * How far the tray must lift so the keyboard does not cover its controls.
 * Ignores the small (browser chrome) deltas that would make the tray jitter.
 */
export function trayKeyboardLift(): number {
  const viewport = typeof window === 'undefined' ? null : window.visualViewport;
  if (!viewport) return 0;
  const inset = window.innerHeight - viewport.height - viewport.offsetTop;
  return inset > 80 ? Math.round(inset) : 0;
}

/**
 * Where a released mobile tray should settle.
 *
 * `half` is the content detent (40% viewport); on short or landscape
 * viewports it can exceed `max`, so it is capped before the thresholds are
 * computed — otherwise a snap target above `max` is unreachable and the tray
 * fights the clamp listener.
 */
export function settleTrayHeight(
  height: number,
  peek: number,
  half: number,
  max: number,
): number {
  if (height > max) return max;
  const halfCapped = Math.min(half, max);
  if (height < (peek + halfCapped) / 2) return peek;
  if (height < (halfCapped + max) / 2) return halfCapped;
  return max;
}
