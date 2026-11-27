import { describe, expect, it } from 'vitest';
import { companyPosters } from '../data';
import { getFullPosterR2Url } from './downloadPoster';

describe('getFullPosterR2Url', () => {
  it('resolves every display poster to its R2 original', () => {
    const missing = companyPosters.filter((poster) => !getFullPosterR2Url(poster.src));
    expect(missing.map((poster) => poster.src)).toEqual([]);
  });

  it('resolves by the content-addressed manifest id as well', () => {
    expect(getFullPosterR2Url('c2-monee-slide-1')).toMatch(
      /\/orig\/c2-monee\/slide-1-[a-f0-9]{8}\.(jpg|png|webp|pdf)$/,
    );
  });

  it('returns null for an unknown poster', () => {
    expect(getFullPosterR2Url('/posters/companies/nope/nope.webp')).toBeNull();
  });
});
