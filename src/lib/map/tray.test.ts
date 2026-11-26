import { describe, expect, it } from 'vitest';
import { settleTrayHeight } from './tray';

const PEEK = 110;
const HALF = 400;
const MAX = 600;

describe('settleTrayHeight', () => {
  it('returns to peek when released near the collapsed bar', () => {
    expect(settleTrayHeight(150, PEEK, HALF, MAX)).toBe(PEEK);
  });

  it('settles on the content detent in the middle band', () => {
    expect(settleTrayHeight(380, PEEK, HALF, MAX)).toBe(HALF);
  });

  it('expands to max above the half/max midpoint', () => {
    expect(settleTrayHeight(560, PEEK, HALF, MAX)).toBe(MAX);
  });

  it('never returns a detent above max on short viewports', () => {
    // Landscape phone: 40% detent (400) is taller than the 50% cap (300).
    expect(settleTrayHeight(320, PEEK, 400, 300)).toBe(300);
    expect(settleTrayHeight(900, PEEK, 400, 300)).toBe(300);
  });

  it('snaps rubber-band overshoot back to max', () => {
    expect(settleTrayHeight(MAX + 28, PEEK, HALF, MAX)).toBe(MAX);
  });
});
