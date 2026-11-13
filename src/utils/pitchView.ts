export type PitchVariant = "full" | "half-top";

export interface PitchPoint {
  x: number;
  y: number;
}

/**
 * Maps a point stored in full-pitch % coordinates into the top half of the
 * pitch (y 0-50), the half shown by the "half-top" pitch variant.
 *
 * Points in the bottom half are rotated 180 degrees around the centre spot
 * (x -> 100 - x, y -> 100 - y) so that shots at either goal are shown
 * attacking the top goal. Points already in the top half are unchanged.
 */
export const mirrorToTopHalf = <T extends PitchPoint>(point: T): T =>
  point.y > 50 ? { ...point, x: 100 - point.x, y: 100 - point.y } : point;

/**
 * Converts a point dropped on the pitch (as displayed) back to stored
 * coordinates for an item stored at `stored`. In the half view a mirrored
 * item stays in the bottom half, so it is shown exactly where it was dropped.
 */
export const displayToStored = (
  stored: PitchPoint,
  dropped: PitchPoint,
  variant: PitchVariant,
): PitchPoint => {
  const wasMirrored = variant === "half-top" && stored.y > 50;
  return wasMirrored && dropped.y < 50
    ? { x: 100 - dropped.x, y: 100 - dropped.y }
    : { x: dropped.x, y: dropped.y };
};
