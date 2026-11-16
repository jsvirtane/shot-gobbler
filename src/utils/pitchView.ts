import { Team } from "../types/common";

export type PitchVariant = "full" | "half-top";

export interface PitchPoint {
  x: number;
  y: number;
}

/**
 * The part of the full pitch each variant shows, in full-pitch % (y from
 * the top goal line): `top` is where the visible area starts and `height`
 * how much of the pitch it shows.
 */
export const PITCH_WINDOW: Record<
  PitchVariant,
  { top: number; height: number }
> = {
  full: { top: 0, height: 100 },
  "half-top": { top: 0, height: 50 },
};

/**
 * Where a displayed full-pitch % point sits in the visible area, as shares
 * (0-1) of its width and height.
 */
export const toVisibleShare = (
  point: PitchPoint,
  variant: PitchVariant,
): PitchPoint => {
  const { top, height } = PITCH_WINDOW[variant];
  return { x: point.x / 100, y: (point.y - top) / height };
};

/** The point rotated 180 degrees around the centre spot. */
export const mirrorPoint = <T extends PitchPoint>(point: T): T => ({
  ...point,
  x: 100 - point.x,
  y: 100 - point.y,
});

/**
 * The team attacking the goal nearest the point: home attacks the top goal
 * (y < 50), away the bottom one. Matches `attackedGoal` used for xG.
 */
export const teamForPoint = ({ y }: PitchPoint): Team =>
  y < 50 ? "home" : "away";

/**
 * The point in the team's attacking half: unchanged when it is already
 * there, otherwise rotated 180 degrees. Shots are stored this way so that
 * xG is measured to the goal the team attacks.
 */
export const toAttackingHalf = <T extends PitchPoint>(
  point: T,
  team: Team,
): T => (teamForPoint(point) === team ? point : mirrorPoint(point));

/**
 * Maps a point stored in full-pitch % coordinates into the top half of the
 * pitch (y 0-50), the half shown by the "half-top" pitch variant.
 *
 * Points in the bottom half are rotated 180 degrees around the centre spot
 * (x -> 100 - x, y -> 100 - y) so that shots at either goal are shown
 * attacking the top goal. Points already in the top half are unchanged.
 */
export const mirrorToTopHalf = <T extends PitchPoint>(point: T): T =>
  point.y > 50 ? mirrorPoint(point) : point;

/** Where a stored point is drawn in the variant. */
export const storedToDisplay = <T extends PitchPoint>(
  point: T,
  variant: PitchVariant,
): T => (variant === "half-top" ? mirrorToTopHalf(point) : point);

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
