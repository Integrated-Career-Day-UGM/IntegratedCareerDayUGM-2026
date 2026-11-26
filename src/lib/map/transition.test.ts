import { describe, expect, it } from 'vitest';
import { mapTransitionKey } from './transition';

const base = {
  venueId: 'gik',
  areaId: 'hall-c1',
  trackId: 'career-expo',
};

describe('mapTransitionKey', () => {
  it('stays stable when nothing changes', () => {
    expect(mapTransitionKey(base)).toBe(mapTransitionKey({ ...base }));
  });

  it('changes for every plan tab', () => {
    expect(mapTransitionKey({ ...base, trackId: 'career-counseling' })).not.toBe(
      mapTransitionKey(base),
    );
    expect(mapTransitionKey({ ...base, trackId: 'walk-in-interview' })).not.toBe(
      mapTransitionKey(base),
    );
  });

  it('changes for area and venue swaps', () => {
    expect(mapTransitionKey({ ...base, areaId: 'hall-b' })).not.toBe(
      mapTransitionKey(base),
    );
    expect(mapTransitionKey({ ...base, venueId: 'other' })).not.toBe(
      mapTransitionKey(base),
    );
  });
});
