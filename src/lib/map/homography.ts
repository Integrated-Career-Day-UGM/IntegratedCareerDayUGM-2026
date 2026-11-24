export type Point2D = { x: number; y: number };

/**
 * Returns h = [h0..h7] for the projective transform
 *   x' = (h0*x + h1*y + h2) / (h6*x + h7*y + 1)
 *   y' = (h3*x + h4*y + h5) / (h6*x + h7*y + 1)
 */
export function solveHomography(src: Point2D[], dst: Point2D[]): number[] | null {
  const equations: number[][] = [];
  const rhs: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    equations.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    rhs.push(dx);
    equations.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    rhs.push(dy);
  }

  const n = rhs.length;
  const m = equations.map((row, i) => [...row, rhs[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(m[k][i]) > Math.abs(m[maxRow][i])) maxRow = k;
    }
    if (Math.abs(m[maxRow][i]) < 1e-10) return null;
    [m[i], m[maxRow]] = [m[maxRow], m[i]];

    for (let k = i + 1; k < n; k++) {
      const factor = m[k][i] / m[i][i];
      for (let j = i; j <= n; j++) m[k][j] -= factor * m[i][j];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = m[i][n];
    for (let j = i + 1; j < n; j++) sum -= m[i][j] * x[j];
    x[i] = sum / m[i][i];
  }
  return x;
}

export function homographyToMatrix3d(h: number[]): string {
  // Column-major CSS matrix3d matching solveHomography's convention:
  // X = h0*x + h1*y + h2, Y = h3*x + h4*y + h5, W = h6*x + h7*y + 1.
  return `matrix3d(${h[0]}, ${h[3]}, 0, ${h[6]}, ${h[1]}, ${h[4]}, 0, ${h[7]}, 0, 0, 1, 0, ${h[2]}, ${h[5]}, 0, 1)`;
}

export function transformPoint(h: number[], p: Point2D): Point2D {
  const denom = h[6] * p.x + h[7] * p.y + (h[8] ?? 1);
  return {
    x: (h[0] * p.x + h[1] * p.y + h[2]) / denom,
    y: (h[3] * p.x + h[4] * p.y + h[5]) / denom,
  };
}

/**
 * Invert a 3x3 row-major projective matrix ([h0..h7, h8], conventionally
 * h8 = 1). The result is normalised so its h8 is 1 again, keeping the
 * transformPoint/homographyToMatrix3d convention intact.
 */
export function invertMatrix3(h: number[]): number[] | null {
  const a = h[0], b = h[1], c = h[2];
  const d = h[3], e = h[4], f = h[5];
  const g = h[6], i = h[7], j = h[8] ?? 1;

  const det =
    a * (e * j - f * i) -
    b * (d * j - f * g) +
    c * (d * i - e * g);
  if (Math.abs(det) < 1e-12) return null;

  const inv = [
    e * j - f * i,
    c * i - b * j,
    b * f - c * e,
    f * g - d * j,
    a * j - c * g,
    c * d - a * f,
    d * i - e * g,
    b * g - a * i,
    a * e - b * d,
  ];
  const scale = inv[8];
  if (Math.abs(scale) < 1e-12) return null;
  return inv.map((v) => v / scale);
}
