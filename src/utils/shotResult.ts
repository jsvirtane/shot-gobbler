import { Shot, ShotResult } from "../types/Shot";

/**
 * Returns the result of a shot. Shots recorded before the `result` field
 * existed only have `isGoal`, so fall back to Goal/Miss for those.
 */
export const getShotResult = (
  shot: Pick<Shot, "isGoal"> & { result?: ShotResult },
): ShotResult => shot.result ?? (shot.isGoal ? "Goal" : "Miss");

/**
 * The one colour of each result, used by the radial menu, the shot list and
 * the shot card: green, cyan, gray and red, apart from the blue / orange
 * team colours. `fill` is hex for SVG; `text` a Tailwind class (written out
 * in full so Tailwind finds it).
 */
const SHOT_RESULT_COLORS: Record<ShotResult, { fill: string; text: string }> = {
  Goal: { fill: "#16a34a", text: "text-green-600" },
  Saved: { fill: "#0891b2", text: "text-cyan-600" },
  Blocked: { fill: "#4b5563", text: "text-gray-600" },
  Miss: { fill: "#dc2626", text: "text-red-600" },
};

const pick = <K extends "fill" | "text">(key: K) =>
  Object.fromEntries(
    Object.entries(SHOT_RESULT_COLORS).map(([result, c]) => [result, c[key]]),
  ) as Record<ShotResult, string>;

/** Hex fill of each result (radial menu segments). */
export const SHOT_RESULT_FILLS = pick("fill");

/** Text colour class of each result (shot list, shot card). */
export const shotResultTextColors = pick("text");
