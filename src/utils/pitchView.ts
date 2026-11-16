import { Team } from "../types/common";

/**
 * "full" shows the whole pitch. "half" shows one half with the attacked
 * goal at the bottom of the screen, under the thumb.
 */
export type PitchVariant = "full" | "half";

export interface PitchPoint {
  x: number;
  y: number;
}

/**
 * The part of the full pitch each variant shows, in full-pitch % (y from
 * the top goal line): `top` is where the visible area starts and `height`
 * how much of the pitch it shows. The half view shows the bottom half,
 * so the goal there is at the bottom of the screen.
 */
export const PITCH_WINDOW: Record<
  PitchVariant,
  { top: number; height: number }
> = {
  full: { top: 0, height: 100 },
  half: { top: 50, height: 50 },
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

/**
 * Inverse of `toVisibleShare`: the displayed full-pitch % point at shares
 * (0-1) of the visible area's width and height.
 */
export const fromVisibleShare = (
  share: PitchPoint,
  variant: PitchVariant,
): PitchPoint => {
  const { top, height } = PITCH_WINDOW[variant];
  return { x: share.x * 100, y: top + share.y * height };
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
 * Maps a point stored in full-pitch % coordinates into the bottom half of
 * the pitch (y 50-100), the half shown by the "half" pitch variant.
 *
 * Points in the top half are rotated 180 degrees around the centre spot
 * (x -> 100 - x, y -> 100 - y) so that shots at either goal are shown
 * attacking the bottom goal. Points already in the bottom half are
 * unchanged.
 */
export const mirrorToBottomHalf = <T extends PitchPoint>(point: T): T =>
  point.y < 50 ? mirrorPoint(point) : point;

/** Where a stored point is drawn in the variant. */
export const storedToDisplay = <T extends PitchPoint>(
  point: T,
  variant: PitchVariant,
): T => (variant === "half" ? mirrorToBottomHalf(point) : point);

/**
 * Converts a point dropped on the pitch (as displayed) back to stored
 * coordinates for an item stored at `stored`. In the half view a mirrored
 * item stays in the top half, so it is shown exactly where it was dropped.
 */
export const displayToStored = (
  stored: PitchPoint,
  dropped: PitchPoint,
  variant: PitchVariant,
): PitchPoint => {
  const wasMirrored = variant === "half" && stored.y < 50;
  return wasMirrored && dropped.y > 50
    ? mirrorPoint({ x: dropped.x, y: dropped.y })
    : { x: dropped.x, y: dropped.y };
};
