import { describe, expect, it } from 'vitest';
import { atan2Approx, pupilOffset } from './tracking';

describe('atan2Approx', () => {
  it('matches the axes and quadrants within the polynomial error', () => {
    expect(atan2Approx(0, 0)).toBe(0);
    expect(atan2Approx(1, 0)).toBeCloseTo(Math.PI / 2, 3);
    expect(atan2Approx(-1, 0)).toBeCloseTo(-Math.PI / 2, 3);
    expect(atan2Approx(0, -1)).toBeCloseTo(Math.PI, 3);
    expect(atan2Approx(1, 1)).toBeCloseTo(Math.PI / 4, 3);
    expect(atan2Approx(-1, -1)).toBeCloseTo((-3 * Math.PI) / 4, 3);
  });

  it('guards non-finite and degenerate inputs', () => {
    expect(atan2Approx(Number.NaN, 1)).toBe(0);
    expect(atan2Approx(1, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('pupilOffset', () => {
  it('points at the cursor and clamps to maxRadius', () => {
    const far = pupilOffset(100, 100, 200, 100, 14);
    expect(far.x).toBeCloseTo(14);
    expect(far.y).toBeCloseTo(0);

    const diagonal = pupilOffset(0, 0, 30, 40, 10);
    expect(diagonal.x).toBeCloseTo(6);
    expect(diagonal.y).toBeCloseTo(8);
  });

  it('uses the quadrant from atan2', () => {
    const up = pupilOffset(0, 0, 0, -20, 10);
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeCloseTo(-10);

    const left = pupilOffset(0, 0, -20, 0, 10);
    expect(left.x).toBeCloseTo(-10);
    expect(left.y).toBeCloseTo(0);
  });

  it('rests at 0,0 when the cursor is on the sclera centre', () => {
    expect(pupilOffset(5, 5, 5, 5, 14)).toEqual({ x: 0, y: 0 });
  });

  it('never returns NaN for degenerate input', () => {
    expect(pupilOffset(Number.NaN, 0, 10, 10, 10)).toEqual({ x: 0, y: 0 });
    expect(pupilOffset(0, 0, Number.POSITIVE_INFINITY, 10, 10)).toEqual({ x: 0, y: 0 });
    expect(pupilOffset(0, 0, 10, 10, 0)).toEqual({ x: 0, y: 0 });
    expect(pupilOffset(0, 0, 10, 10, -5)).toEqual({ x: 0, y: 0 });
  });
});
