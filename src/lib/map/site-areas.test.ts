import { describe, expect, it } from 'vitest';
import {
  NPC_GEOJSON,
  SITE_AREAS_GEOJSON,
  ringDistanceMeters,
  snapClosedRing,
} from './site-areas';
import type { FeatureCollection, Polygon } from 'geojson';

const collections: [string, FeatureCollection<Polygon>][] = [
  ['npc', NPC_GEOJSON],
  ['sites', SITE_AREAS_GEOJSON],
];

describe('snapClosedRing', () => {
  it('closes a ring whose last vertex misses the first by centimetres', () => {
    const ring = snapClosedRing([
      [110.3760201, -7.7743621],
      [110.3762301, -7.774495],
      [110.3765124, -7.7740716],
      [110.3760196, -7.7743623],
    ]);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring.length).toBeGreaterThanOrEqual(4);
  });

  it('drops consecutive duplicates', () => {
    const ring = snapClosedRing([
      [110.3758, -7.774],
      [110.3758, -7.774],
      [110.3759, -7.7741],
      [110.37585, -7.7742],
    ]);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring.length).toBe(4);
  });
});

describe('site GeoJSON', () => {
  it.each(collections)('%s polygons are valid closed rings', (_name, collection) => {
    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      const ring = feature.geometry.coordinates[0];
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring[0]).toEqual(ring[ring.length - 1]);
      const unique = new Set(ring.map((point) => point.join(',')));
      expect(unique.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('has no duplicate vertices left inside a ring', () => {
    for (const [, collection] of collections) {
      for (const feature of collection.features) {
        const ring = feature.geometry.coordinates[0];
        for (let i = 1; i < ring.length; i += 1) {
          expect(
            ringDistanceMeters(
              ring[i - 1] as [number, number],
              ring[i] as [number, number],
            ),
          ).toBeGreaterThan(0.5);
        }
      }
    }
  });
});
