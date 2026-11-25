/**
 * Key for the map-shell floor transition. Track/area/venue changes swap the
 * plan, so they must produce a new key. GIK is only a camera overview, not a
 * floor swap, and must not veil the first venue entry after reload.
 */
export type MapTransitionState = {
  venueId: string;
  areaId: string;
  trackId: string;
};

export function mapTransitionKey({
  venueId,
  areaId,
  trackId,
}: MapTransitionState): string {
  return `${venueId}|${areaId}|${trackId}`;
}
