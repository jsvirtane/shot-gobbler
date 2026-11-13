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
