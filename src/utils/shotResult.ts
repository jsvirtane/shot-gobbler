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
