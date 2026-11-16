import { Shot, ShotResult } from "../types/Shot";

/**
 * Returns the result of a shot. Shots recorded before the `result` field
 * existed only have `isGoal`, so fall back to Goal/Miss for those.
 */
export const getShotResult = (
  shot: Pick<Shot, "isGoal"> & { result?: ShotResult },
): ShotResult => shot.result ?? (shot.isGoal ? "Goal" : "Miss");

export const shotResultTextColors: Record<ShotResult, string> = {
  Goal: "text-green-600",
  Saved: "text-orange-600",
  Blocked: "text-gray-600",
  Miss: "text-red-600",
};

/**
 * Fill of each result in the radial menu (hex, drawn in SVG): green, cyan,
 * gray and red, apart from the blue / orange team colours.
 */
export const SHOT_RESULT_FILLS: Record<ShotResult, string> = {
  Goal: "#16a34a", // green-600
  Saved: "#0891b2", // cyan-600
  Blocked: "#4b5563", // gray-600
  Miss: "#dc2626", // red-600
};
