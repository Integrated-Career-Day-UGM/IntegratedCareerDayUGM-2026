import { describe, expect, it, vi } from 'vitest';
import {
  BOOTH_HIT_TARGETS,
  BOOTH_SHAPES,
  WALKIN_2F,
  boothAtFramePoint,
  walkInRoomFrameBox,
} from './floorplan';
import type { Point2D } from './homography';

/**
 * The pre-optimisation implementation, kept verbatim as the oracle. Every
 * assertion below compares against this instead of hand-picked ids, so
 * changing booth data cannot silently weaken the test.
 */
function referenceBoothAtFramePoint(p: Point2D): string | null {
  for (const s of BOOTH_SHAPES) {
    const dx = p.x - (s.left + s.w / 2);
    const dy = p.y - (s.top + s.h / 2);
    const a = (-s.rotate * Math.PI) / 180;
    const rx = dx * Math.cos(a) - dy * Math.sin(a);
    const ry = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(rx) <= s.innerW / 2 + 2 && Math.abs(ry) <= s.innerH / 2 + 2) {
      return s.id;
    }
  }
  return null;
}

/** Local booth coordinates -> frame coordinates (inverse of the hit test). */
function boothLocalToFrame(
  target: (typeof BOOTH_HIT_TARGETS)[number],
  x: number,
  y: number,
): Point2D {
  return {
    x: target.cx + x * target.cos + y * target.sin,
    y: target.cy - x * target.sin + y * target.cos,
  };
}

describe('boothAtFramePoint', () => {
  it('keeps one hit target per booth, in render order', () => {
    expect(BOOTH_HIT_TARGETS.map((target) => target.id)).toEqual(
      BOOTH_SHAPES.map((shape) => shape.id),
    );
  });

  it('matches the old scan at every rotated corner and just around it', () => {
    for (const target of BOOTH_HIT_TARGETS) {
      const samples = [
        [target.halfW, target.halfH],
        [target.halfW, -target.halfH],
        [-target.halfW, target.halfH],
        [-target.halfW, -target.halfH],
      ];

      for (const [x, y] of samples) {
        const corner = boothLocalToFrame(target, x, y);
        expect(boothAtFramePoint(corner)).toBe(referenceBoothAtFramePoint(corner));

        // A hair inside the corner must resolve (exact corners can land on a
        // float boundary, which the legacy implementation also rejects).
        const inside = boothLocalToFrame(
          target,
          x - Math.sign(x) * 0.01,
          y - Math.sign(y) * 0.01,
        );
        expect(referenceBoothAtFramePoint(inside)).not.toBeNull();
        expect(boothAtFramePoint(inside)).toBe(referenceBoothAtFramePoint(inside));

        for (const offset of [-1, 0, 1]) {
          const point = boothLocalToFrame(target, x + offset, y);
          expect(boothAtFramePoint(point)).toBe(referenceBoothAtFramePoint(point));

          const vertical = boothLocalToFrame(target, x, y + offset);
          expect(boothAtFramePoint(vertical)).toBe(
            referenceBoothAtFramePoint(vertical),
          );
        }
      }
    }
  });

  it('matches the old scan across the whole floor plan', () => {
    for (let x = -20; x <= 838; x += 11) {
      for (let y = -20; y <= 840; y += 11) {
        const point = { x, y };
        expect(boothAtFramePoint(point)).toBe(referenceBoothAtFramePoint(point));
      }
    }
  });

  it('does no trig on the pointermove path', () => {
    const cos = vi.spyOn(Math, 'cos');
    const sin = vi.spyOn(Math, 'sin');

    boothAtFramePoint({ x: 300, y: 400 });
    boothAtFramePoint({ x: -10_000, y: -10_000 });

    const cosCalls = cos.mock.calls.length;
    const sinCalls = sin.mock.calls.length;
    cos.mockRestore();
    sin.mockRestore();

    expect(cosCalls).toBe(0);
    expect(sinCalls).toBe(0);
  });

  it('still misses the empty frame', () => {
    expect(boothAtFramePoint({ x: -10_000, y: -10_000 })).toBeNull();
  });
});

describe('walkInRoomFrameBox', () => {
  it('returns null for an unknown room', () => {
    expect(walkInRoomFrameBox(WALKIN_2F, 'F99')).toBeNull();
  });

  it('contains the composed room centre in frame space', () => {
    const room = WALKIN_2F.rooms[0];
    const box = walkInRoomFrameBox(WALKIN_2F, room.id);
    expect(box).not.toBeNull();

    const rw = room.w * WALKIN_2F.content.scale;
    const rh = room.h * WALKIN_2F.content.scale;
    const cx = WALKIN_2F.content.left + room.left * WALKIN_2F.content.scale + rw / 2;
    const cy = WALKIN_2F.content.top + room.top * WALKIN_2F.content.scale + rh / 2;

    const ha = (WALKIN_2F.hull.rotate * Math.PI) / 180;
    const dx = cx - WALKIN_2F.hull.w / 2;
    const dy = cy - WALKIN_2F.hull.h / 2;
    const frameX = WALKIN_2F.hull.left + WALKIN_2F.hull.w / 2 + dx * Math.cos(ha) - dy * Math.sin(ha);
    const frameY = WALKIN_2F.hull.top + WALKIN_2F.hull.h / 2 + dx * Math.sin(ha) + dy * Math.cos(ha);

    expect(frameX).toBeGreaterThanOrEqual(box!.left);
    expect(frameX).toBeLessThanOrEqual(box!.left + box!.w);
    expect(frameY).toBeGreaterThanOrEqual(box!.top);
    expect(frameY).toBeLessThanOrEqual(box!.top + box!.h);
  });
});
