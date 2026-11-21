import {
  ACTION_CATEGORY_MARKER_COLORS,
  TEAM_MARKER_COLORS,
} from "../constants/markerColors";
import { Action } from "../types/Action";
import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";
import { isSpotKick, Shot, ShotResult } from "../types/Shot";
import { isSuccessfulActionOutcome } from "./isSuccessfulActionOutcome";
import { getShotResult } from "./shotResult";
import { shotXg } from "./xg";

/** Shapes a marker can be drawn as. "ring" is a hollow circle. */
export type MarkerShapeName = "star" | "circle" | "triangle" | "ring";

/** Shape per shot result, so the result reads without colour. */
export const SHOT_RESULT_SHAPES: Record<ShotResult, MarkerShapeName> = {
  Goal: "star",
  Saved: "circle",
  Blocked: "triangle",
  Miss: "ring",
};

/**
 * Stars and triangles cover less area than a circle of the same width, so
 * they are drawn larger to look about as heavy.
 */
const SHAPE_SCALE: Record<MarkerShapeName, number> = {
  star: 1.35,
  triangle: 1.2,
  circle: 1,
  ring: 1,
};

/** Box (px) a shape of the given visible size is drawn in. */
export const markerBoxSize = (shape: MarkerShapeName, size: number) =>
  Math.round(size * SHAPE_SCALE[shape]);

export const getShotMarkerShape = (result: ShotResult): MarkerShapeName =>
  SHOT_RESULT_SHAPES[result];

/** Visible marker size (px) at xG 0. */
export const SHOT_MARKER_MIN_SIZE = 12;
/** Visible marker size (px) at xG >= SHOT_MARKER_FULL_XG. */
export const SHOT_MARKER_MAX_SIZE = 26;
/** xG at which a marker reaches its full size. */
export const SHOT_MARKER_FULL_XG = 0.5;
/**
 * Spot kicks (penalties, futsal 10 m kicks) all have the same high xG;
 * capping their size keeps them from dominating the map.
 */
export const PENALTY_MARKER_SIZE = 20;

/** Visible size (px) of a shot marker for its xG, from 12 to 26 px. */
export const shotMarkerSize = (
  xg: number,
  shotType?: Shot["shotType"],
): number => {
  const share = Math.min(1, Math.max(0, xg / SHOT_MARKER_FULL_XG));
  const size = Math.round(
    SHOT_MARKER_MIN_SIZE +
      share * (SHOT_MARKER_MAX_SIZE - SHOT_MARKER_MIN_SIZE),
  );
  return shotType && isSpotKick(shotType)
    ? Math.min(size, PENALTY_MARKER_SIZE)
    : size;
};

export interface MarkerStyle {
  shape: MarkerShapeName;
  color: string;
  size: number;
}

/** Shape (result), colour (team) and size (xG) of a shot marker. */
export const getShotMarkerStyle = (
  shot: Shot,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): MarkerStyle => ({
  shape: getShotMarkerShape(getShotResult(shot)),
  color: TEAM_MARKER_COLORS[shot.team],
  size: shotMarkerSize(shotXg(shot, pitch), shot.shotType),
});

/** Visible size (px) of a touch marker. */
export const ACTION_MARKER_SIZE = 18;

/**
 * Touch marker: colour by category, filled when successful and hollow when
 * not, so the outcome reads without colour.
 */
export const getActionMarkerStyle = (
  action: Pick<Action, "category" | "outcome">,
): MarkerStyle => ({
  shape: isSuccessfulActionOutcome(action.outcome) ? "circle" : "ring",
  color:
    ACTION_CATEGORY_MARKER_COLORS[action.category] ??
    ACTION_CATEGORY_MARKER_COLORS.duel,
  size: ACTION_MARKER_SIZE,
});
