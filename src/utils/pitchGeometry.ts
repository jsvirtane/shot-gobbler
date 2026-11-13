import { Coordinates } from "../types/common";

/*
 * Calibration of stored pitch % coordinates (0-100 of the pitch box) to
 * metres on the playing area.
 *
 * `src/assets/football_pitch.svg` has `viewBox="0 0 74 111"` (1 unit = 1 m)
 * and draws the playing area as a 68 x 105 rectangle translated by (3, 3):
 * a 3 m margin on every side. Touchlines are x = 3 and x = 71, goal lines
 * y = 3 and y = 108; the penalty spots are 11 m in from each goal line.
 *
 * The pitch box in `PitchContainer` uses a 74:110 aspect ratio, slightly
 * wider than the 74:111 image. The <img> keeps the SVG's default
 * `preserveAspectRatio` (xMidYMid meet), so the image fills the full height
 * and is centred horizontally with a thin strip on each side. In image units
 * the box is therefore 111 tall and 111 * 74 / 110 wide.
 */
const IMAGE_WIDTH = 74;
const IMAGE_HEIGHT = 111;
const BOX_ASPECT_RATIO = 74 / 110;
const BOX_HEIGHT = IMAGE_HEIGHT;
const BOX_WIDTH = BOX_HEIGHT * BOX_ASPECT_RATIO;
const IMAGE_OFFSET_X = (BOX_WIDTH - IMAGE_WIDTH) / 2;
/** Margin around the playing area inside the image, in metres. */
const PLAYING_AREA_MARGIN = 3;

export const PITCH_WIDTH_M = 68;
export const PITCH_LENGTH_M = 105;
export const GOAL_WIDTH_M = 7.32;

export type Goal = "top" | "bottom";

/**
 * Converts a stored % point to metres on the playing area: x from the left
 * touchline (0-68), y from the top goal line (0-105). Points tapped in the
 * margin outside the lines fall slightly outside those ranges.
 */
export const toMetres = ({ x, y }: Coordinates): Coordinates => ({
  x: (x / 100) * BOX_WIDTH - IMAGE_OFFSET_X - PLAYING_AREA_MARGIN,
  y: (y / 100) * BOX_HEIGHT - PLAYING_AREA_MARGIN,
});

/** Inverse of `toMetres`. */
export const fromMetres = ({ x, y }: Coordinates): Coordinates => ({
  x: ((x + PLAYING_AREA_MARGIN + IMAGE_OFFSET_X) / BOX_WIDTH) * 100,
  y: ((y + PLAYING_AREA_MARGIN) / BOX_HEIGHT) * 100,
});

const goalLineY = (goal: Goal) => (goal === "top" ? 0 : PITCH_LENGTH_M);

/**
 * The goal a shot from this point is aimed at. Shots are almost always taken
 * in the attacking half, so the nearest goal is assumed (y < 50 % -> top).
 */
export const attackedGoal = ({ y }: Coordinates): Goal =>
  y < 50 ? "top" : "bottom";

/** Straight-line distance in metres from the point to the centre of the goal. */
export const distanceToGoal = (point: Coordinates, goal: Goal): number => {
  const m = toMetres(point);
  return Math.hypot(m.x - PITCH_WIDTH_M / 2, m.y - goalLineY(goal));
};

/**
 * Angle in degrees subtended by the two goalposts as seen from the point:
 * the width of goal the shooter can see. 0 on the goal line outside the
 * posts, 180 on the goal line between them.
 */
export const shotAngle = (point: Coordinates, goal: Goal): number => {
  const m = toMetres(point);
  // Distance out from the goal line, towards the pitch
  const depth = Math.abs(m.y - goalLineY(goal));
  const centre = PITCH_WIDTH_M / 2;
  const toLeftPost = Math.atan2(centre - GOAL_WIDTH_M / 2 - m.x, depth);
  const toRightPost = Math.atan2(centre + GOAL_WIDTH_M / 2 - m.x, depth);
  return ((toRightPost - toLeftPost) * 180) / Math.PI;
};
