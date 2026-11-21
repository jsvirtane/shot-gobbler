import { Coordinates } from "../types/common";
import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";
import { PITCH_SPECS, pitchSpec } from "./pitchSpecs";

/*
 * Calibration of stored pitch % coordinates (0-100 of the pitch box) to
 * metres on the playing area. Each pitch type (`PITCH_SPECS`) has its own
 * image and box; the football one is described here, futsal follows the
 * same layout (`futsal_pitch.svg`, 24 x 44 with a 2 m margin, in a box of
 * the same ratio).
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
export const PITCH_WIDTH_M = PITCH_SPECS.football.widthM;
export const PITCH_LENGTH_M = PITCH_SPECS.football.lengthM;
export const GOAL_WIDTH_M = PITCH_SPECS.football.goalWidthM;

/**
 * Size of the pitch box in image units (metres): the box is as tall as the
 * image and `boxAspectRatio` wide, with the image centred in it.
 */
const boxGeometry = (pitch: PitchType) => {
  const spec = pitchSpec(pitch);
  const imageWidth = spec.widthM + 2 * spec.marginM;
  const boxHeight = spec.lengthM + 2 * spec.marginM;
  const boxWidth = boxHeight * spec.boxAspectRatio;
  return {
    spec,
    boxWidth,
    boxHeight,
    imageOffsetX: (boxWidth - imageWidth) / 2,
  };
};

export type Goal = "top" | "bottom";

/**
 * Converts a stored % point to metres on the playing area: x from the left
 * touchline (0-68 on a football pitch), y from the top goal line (0-105). Points tapped in the
 * margin outside the lines fall slightly outside those ranges.
 */
export const toMetres = (
  { x, y }: Coordinates,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): Coordinates => {
  const { spec, boxWidth, boxHeight, imageOffsetX } = boxGeometry(pitch);
  return {
    x: (x / 100) * boxWidth - imageOffsetX - spec.marginM,
    y: (y / 100) * boxHeight - spec.marginM,
  };
};

/** Inverse of `toMetres`. */
export const fromMetres = (
  { x, y }: Coordinates,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): Coordinates => {
  const { spec, boxWidth, boxHeight, imageOffsetX } = boxGeometry(pitch);
  return {
    x: ((x + spec.marginM + imageOffsetX) / boxWidth) * 100,
    y: ((y + spec.marginM) / boxHeight) * 100,
  };
};

const goalLineY = (goal: Goal, pitch: PitchType) =>
  goal === "top" ? 0 : pitchSpec(pitch).lengthM;

/**
 * The goal a shot from this point is aimed at. Shots are almost always taken
 * in the attacking half, so the nearest goal is assumed (y < 50 % -> top).
 */
export const attackedGoal = ({ y }: Coordinates): Goal =>
  y < 50 ? "top" : "bottom";

/** Straight-line distance in metres from the point to the centre of the goal. */
export const distanceToGoal = (
  point: Coordinates,
  goal: Goal,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number => {
  const m = toMetres(point, pitch);
  return Math.hypot(
    m.x - pitchSpec(pitch).widthM / 2,
    m.y - goalLineY(goal, pitch),
  );
};

/**
 * Angle in degrees subtended by the two goalposts as seen from the point:
 * the width of goal the shooter can see. 0 on the goal line outside the
 * posts, 180 on the goal line between them.
 */
export const shotAngle = (
  point: Coordinates,
  goal: Goal,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number => {
  const { widthM, goalWidthM } = pitchSpec(pitch);
  const m = toMetres(point, pitch);
  // Distance out from the goal line, towards the pitch
  const depth = Math.abs(m.y - goalLineY(goal, pitch));
  const centre = widthM / 2;
  const toLeftPost = Math.atan2(centre - goalWidthM / 2 - m.x, depth);
  const toRightPost = Math.atan2(centre + goalWidthM / 2 - m.x, depth);
  return ((toRightPost - toLeftPost) * 180) / Math.PI;
};
