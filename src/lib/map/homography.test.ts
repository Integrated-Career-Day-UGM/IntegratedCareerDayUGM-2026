import { describe, expect, it } from 'vitest';
import {
  homographyToMatrix3d,
  invertMatrix3,
  solveHomography,
  transformPoint,
  type Point2D,
} from './homography';

const closeTo = (actual: Point2D, expected: Point2D, digits = 6) => {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
};

describe('solveHomography', () => {
  it('maps a square onto an axis-aligned rectangle', () => {
    const src: Point2D[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const dst: Point2D[] = [
      { x: 10, y: 20 },
      { x: 110, y: 20 },
      { x: 110, y: 120 },
      { x: 10, y: 120 },
    ];

    const h = solveHomography(src, dst);
    expect(h).not.toBeNull();
    src.forEach((point, index) => closeTo(transformPoint(h!, point), dst[index]));
  });

  it('maps a square onto a projective quadrilateral', () => {
    const src: Point2D[] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 200 },
      { x: 0, y: 200 },
    ];
    const dst: Point2D[] = [
      { x: 40, y: 60 },
      { x: 320, y: 40 },
      { x: 280, y: 340 },
      { x: 60, y: 320 },
    ];

    const h = solveHomography(src, dst);
    expect(h).not.toBeNull();
    src.forEach((point, index) => closeTo(transformPoint(h!, point), dst[index]));
  });

  it('returns null for a degenerate source quad', () => {
    const src: Point2D[] = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    const dst: Point2D[] = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ];

    expect(solveHomography(src, dst)).toBeNull();
  });
});

describe('invertMatrix3', () => {
  it('round-trips points through a projective transform', () => {
    const h = solveHomography(
      [
        { x: 0, y: 0 },
        { x: 818, y: 0 },
        { x: 818, y: 820 },
        { x: 0, y: 820 },
      ],
      [
        { x: 120, y: 90 },
        { x: 930, y: 150 },
        { x: 800, y: 920 },
        { x: 60, y: 780 },
      ],
    );
    expect(h).not.toBeNull();

    const inv = invertMatrix3(h!);
    expect(inv).not.toBeNull();

    for (const point of [
      { x: 0, y: 0 },
      { x: 818, y: 0 },
      { x: 409, y: 410 },
      { x: 300, y: 650 },
    ]) {
      const forward = transformPoint(h!, point);
      closeTo(transformPoint(inv!, forward), point, 5);
    }
  });

  it('returns null for a singular matrix', () => {
    expect(invertMatrix3([1, 2, 3, 2, 4, 6, 0, 0, 1])).toBeNull();
  });
});

describe('homographyToMatrix3d', () => {
  it('writes the identity as a CSS matrix3d', () => {
    expect(homographyToMatrix3d([1, 0, 0, 0, 1, 0, 0, 0, 1])).toBe(
      'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
    );
  });
});
