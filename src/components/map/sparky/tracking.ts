/**
 * Cursor -> pupil displacement. The angle comes from a polynomial `atan2`
 * approximation (the odd-power minimax fit), which is cheaper than
 * `Math.atan2` in the pointer-move hot path. Every input is guarded so the
 * polynomial can never be fed NaN/Infinity or a value outside [-1, 1].
 */

const HALF_PI = Math.PI / 2;
const PI = Math.PI;

// Minimax coefficients for atan on [-1, 1].
const A1 = 0.99997726;
const A3 = -0.33262347;
const A5 = 0.19354346;
const A7 = -0.11643287;
const A9 = 0.05265332;
const A11 = -0.0117212;

/** atan(x) for x in [-1, 1] via Horner on the odd powers. */
export function atanApprox(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x > 1) return HALF_PI - atanApprox(1 / x);
  if (x < -1) return -HALF_PI - atanApprox(1 / x);
  const sq = x * x;
  return x * (A1 + sq * (A3 + sq * (A5 + sq * (A7 + sq * (A9 + sq * A11)))));
}

/**
 * atan2(y, x) with the classic swap + quadrant correction. Returns 0 for the
 * degenerate/NaN cases (the pupil then rests at the sclera centre).
 */
export function atan2Approx(y: number, x: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;

  // Exact axes: the swap trick would lose the sign of x = 0.
  if (x === 0) return y > 0 ? HALF_PI : y < 0 ? -HALF_PI : 0;
  if (y === 0) return x > 0 ? 0 : PI;

  const swap = Math.abs(x) < Math.abs(y);
  const raw = (swap ? x : y) / (swap ? y : x);
  const input = Math.max(-1, Math.min(1, raw));
  let result = atanApprox(input);

  // If swapped, recover atan2 from atan.
  if (swap) {
    result = (input >= 0 ? HALF_PI : -HALF_PI) - result;
  }

  // Quadrant adjustment (same branches as the C reference).
  if (x < 0 && y >= 0) result = PI + result;
  else if (x < 0 && y < 0) result = -PI + result;

  // Defensive normalisation to (-PI, PI].
  if (result > PI) result -= 2 * PI;
  else if (result < -PI) result += 2 * PI;
  return result;
}

export function pupilOffset(
  cx: number,
  cy: number,
  cursorX: number,
  cursorY: number,
  maxRadius: number,
): { x: number; y: number } {
  if (
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(cursorX) ||
    !Number.isFinite(cursorY) ||
    !Number.isFinite(maxRadius) ||
    maxRadius <= 0
  ) {
    return { x: 0, y: 0 };
  }

  const limit = Math.min(maxRadius, 10_000);
  const dx = cursorX - cx;
  const dy = cursorY - cy;
  const distance = Math.min(Math.hypot(dx, dy), limit);
  if (distance === 0) return { x: 0, y: 0 };

  const angle = atan2Approx(dy, dx);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}
