import { Action, ActionCategory, ActionType } from "../../types/Action";
import { isSuccessfulActionOutcome } from "../isSuccessfulActionOutcome";
import { getZoneFromCoordinates, PitchZone } from "../pitchZones";
import { ratio } from "./format";

export const ACTION_CATEGORIES: readonly ActionCategory[] = [
  "attacking",
  "defensive",
  "duel",
];

/** Action types in the order of the touch rings. */
export const ACTION_TYPES: readonly ActionType[] = [
  "pass",
  "cross",
  "dribble",
  "shot",
  "throw-in",
  "tackle",
  "block",
  "interception",
  "clearance",
  "other",
  "aerial",
  "ground",
];

/** Thirds from the attacking end (top of the pitch) down. */
export const VERTICAL_ZONES: readonly PitchZone["vertical"][] = [
  "attacking",
  "midfield",
  "defensive",
];
export const HORIZONTAL_ZONES: readonly PitchZone["horizontal"][] = [
  "left",
  "central",
  "right",
];

export type SuccessCount = {
  successful: number;
  total: number;
  /** successful / total; null when total is 0. */
  rate: number | null;
};

export type ActionTypeRow = SuccessCount & {
  actionType: ActionType;
  category: ActionCategory;
};

/** Counts per 3×3 pitch zone. */
export type ZoneCounts = Record<
  PitchZone["vertical"],
  Record<PitchZone["horizontal"], number>
>;

export type TouchStats = {
  total: number;
  byCategory: Record<ActionCategory, number>;
  /** Only action types that were recorded. */
  byActionType: ActionTypeRow[];
  /** Passes and crosses. */
  passCompletion: SuccessCount;
  defensiveWon: SuccessCount;
  zones: ZoneCounts;
  defensiveZones: ZoneCounts;
};

const successCount = (actions: Action[]): SuccessCount => {
  const successful = actions.filter((a) =>
    isSuccessfulActionOutcome(a.outcome),
  ).length;
  return {
    successful,
    total: actions.length,
    rate: ratio(successful, actions.length),
  };
};

/** Number of actions in each of the 3×3 pitch zones. */
export const getZoneCounts = (actions: Action[]): ZoneCounts => {
  const counts = Object.fromEntries(
    VERTICAL_ZONES.map((v) => [
      v,
      Object.fromEntries(HORIZONTAL_ZONES.map((h) => [h, 0])),
    ]),
  ) as ZoneCounts;
  for (const action of actions) {
    const { vertical, horizontal } = getZoneFromCoordinates(action);
    counts[vertical][horizontal] += 1;
  }
  return counts;
};

/** Everything the touches stats view shows. */
export const getTouchStats = (actions: Action[]): TouchStats => {
  const defensive = actions.filter((a) => a.category === "defensive");
  return {
    total: actions.length,
    byCategory: Object.fromEntries(
      ACTION_CATEGORIES.map((c) => [
        c,
        actions.filter((a) => a.category === c).length,
      ]),
    ) as Record<ActionCategory, number>,
    byActionType: ACTION_TYPES.map((actionType) => {
      const matching = actions.filter((a) => a.actionType === actionType);
      return {
        actionType,
        category: matching[0]?.category ?? "attacking",
        ...successCount(matching),
      };
    }).filter((row) => row.total > 0),
    passCompletion: successCount(
      actions.filter(
        (a) => a.actionType === "pass" || a.actionType === "cross",
      ),
    ),
    defensiveWon: successCount(defensive),
    zones: getZoneCounts(actions),
    defensiveZones: getZoneCounts(defensive),
  };
};
