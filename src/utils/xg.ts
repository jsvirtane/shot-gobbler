import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";
import { isSpotKick, Shot, SpotKickType } from "../types/Shot";
import { attackedGoal, distanceToGoal, shotAngle } from "./pitchGeometry";

/*
 * Expected goals (xG): the probability that a shot is scored.
 *
 * Spot kicks use a fixed conversion rate. Other shots use a logistic
 * regression on distance and angle to goal, the standard shape of simple
 * public xG models (e.g. the distance + angle models in "Soccermatics" /
 * Friends of Tracking tutorials):
 *
 *   xG = 1 / (1 + e^-z)
 *   z  = INTERCEPT + DISTANCE * metres + ANGLE * radians [+ HEADER | OTHER]
 *
 * The coefficients are not fitted on our own data. They are an
 * approximation chosen to reproduce typical published values for foot
 * shots: about 0.4-0.45 from the centre of the six-yard box, 0.15-0.2 from
 * the penalty spot, about 0.1 from the edge of the box and 0.05 from 25 m,
 * with very little from tight angles near the byline. Headers convert at
 * roughly half the rate of foot shots from the same spot.
 *
 * xG is computed when displayed and never stored, so the model can change
 * without migrating saved data.
 *
 * Futsal shots are measured on the futsal pitch (a 3 m goal, a 6 m
 * penalty spot) with the same coefficients. That gives plausible values
 * (about 0.16 from the penalty mark, 0.1 from 10 m) but the model has not
 * been fitted on futsal data.
 *
 * Spot kicks have fixed values (`SPOT_KICK_XG`). Published
 * futsal conversion rates are scarce, so the futsal ones are estimates:
 * the penalty matches football, and the 10 m kick (a longer kick at a
 * smaller goal) is put well below it.
 */
export const PENALTY_XG = 0.76;
/** Futsal's second penalty, from the 10 m mark (an estimate). */
export const TEN_METRE_KICK_XG = 0.45;

/** Fixed xG of each spot kick. */
export const SPOT_KICK_XG: Record<SpotKickType, number> = {
  Penalty: PENALTY_XG,
  "10m Kick": TEN_METRE_KICK_XG,
};
const INTERCEPT = -2.33;
/** Per metre from the centre of the goal. */
const DISTANCE_COEFFICIENT = -0.05;
/** Per radian of goal visible between the posts. */
const ANGLE_COEFFICIENT = 2.0;
/** Added for headers, which are markedly harder to score. */
const HEADER_ADJUSTMENT = -1.0;
/** Added for shots with another body part (chest, knee...). */
const OTHER_BODY_PART_ADJUSTMENT = -0.5;

type XgShot = Pick<Shot, "x" | "y" | "bodyPart" | "shotType">;

/** Expected goals for a shot, between 0 and 1. */
export const shotXg = (
  shot: XgShot,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number => {
  if (isSpotKick(shot.shotType)) return SPOT_KICK_XG[shot.shotType];

  const goal = attackedGoal(shot);
  const distance = distanceToGoal(shot, goal, pitch);
  const angle = (shotAngle(shot, goal, pitch) * Math.PI) / 180;

  let z =
    INTERCEPT + DISTANCE_COEFFICIENT * distance + ANGLE_COEFFICIENT * angle;
  if (shot.bodyPart === "Head") z += HEADER_ADJUSTMENT;
  else if (shot.bodyPart === "Other") z += OTHER_BODY_PART_ADJUSTMENT;

  return 1 / (1 + Math.exp(-z));
};

/** Total xG of the shots. */
export const totalXg = (
  shots: XgShot[],
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number => shots.reduce((sum, shot) => sum + shotXg(shot, pitch), 0);

/** xG with two decimals, e.g. "0.27". */
export const formatXg = (xg: number): string => xg.toFixed(2);
