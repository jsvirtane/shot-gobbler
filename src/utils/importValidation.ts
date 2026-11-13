import {
  Action,
  ActionCategory,
  ActionOutcome,
  ActionType,
} from "../types/Action";
import {
  ChainAction,
  ChainActionType,
  ChainTerminationReason,
  PassChain,
} from "../types/PassChain";
import { BodyPart, Shot, ShotResult, ShotType } from "../types/Shot";
import { DataType, migrate, unwrapAndMigrate } from "./dataSchema";
import { getZoneFromCoordinates, getZonesFromPassChain } from "./pitchZones";

export type ImportDataType = DataType;

const DATA_TYPE_LABELS: Record<ImportDataType, string> = {
  shots: "shots",
  touches: "touches",
  "pass-chains": "pass chains",
};

const TAB_LABELS: Record<ImportDataType, string> = {
  shots: "Shots",
  touches: "Touches",
  "pass-chains": "Chains",
};

const SHOT_RESULTS: readonly ShotResult[] = [
  "Goal",
  "Miss",
  "Saved",
  "Blocked",
];
const BODY_PARTS: readonly BodyPart[] = ["Foot", "Head", "Other"];
const SHOT_TYPES: readonly ShotType[] = ["Open Play", "Set Piece", "Penalty"];

const ACTION_TYPES_BY_CATEGORY: Record<ActionCategory, readonly ActionType[]> =
  {
    attacking: ["pass", "cross", "dribble", "shot", "throw-in"],
    defensive: ["tackle", "block", "interception", "clearance", "other"],
    duel: ["aerial", "ground"],
  };

const ACTION_OUTCOMES: readonly ActionOutcome[] = [
  "successful",
  "unsuccessful",
  "assist",
  "key-pass",
  "goal",
  "on-target",
  "off-target",
  "blocked",
  "won",
  "lost",
  "possession-won",
  "cleared",
];

const CHAIN_ACTION_TYPES: readonly ChainActionType[] = [
  "pass",
  "carry",
  "shot",
  "cross",
  "start",
  "placeholder",
];

const TERMINATION_REASONS: readonly ChainTerminationReason[] = [
  "goal",
  "shot_saved",
  "shot_missed",
  "shot_blocked",
  "tackled",
  "intercepted",
  "clearance",
  "bad_pass",
  "out_of_bounds",
  "fouled",
  "offside",
  "manual_end",
];

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCoordinate = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;

const oneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T => typeof value === "string" && allowed.includes(value as T);

const createId = (prefix = "") =>
  `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const getTimestamp = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : Date.now();

/**
 * Returns a valid Shot built from an imported item, or null if the item is
 * not a shot. Shots exported before the `result` field existed are accepted
 * and get a result derived from `isGoal`.
 */
export const normalizeShot = (item: unknown): Shot | null => {
  if (!isRecord(item)) return null;
  if (!isCoordinate(item.x) || !isCoordinate(item.y)) return null;
  if (item.team !== "home" && item.team !== "away") return null;
  if (!oneOf(item.bodyPart, BODY_PARTS)) return null;
  if (!oneOf(item.shotType, SHOT_TYPES)) return null;

  let result: ShotResult;
  if (item.result === undefined) {
    if (typeof item.isGoal !== "boolean") return null;
    result = item.isGoal ? "Goal" : "Miss";
  } else if (oneOf(item.result, SHOT_RESULTS)) {
    result = item.result;
  } else {
    return null;
  }

  const playerName =
    typeof item.playerName === "string" && item.playerName.trim()
      ? item.playerName.trim()
      : undefined;

  return {
    id: createId(),
    x: item.x,
    y: item.y,
    team: item.team,
    result,
    isGoal: result === "Goal",
    bodyPart: item.bodyPart,
    shotType: item.shotType,
    ...(playerName ? { playerName } : {}),
    timestamp: getTimestamp(item.timestamp),
  };
};

/** Returns a valid Action built from an imported item, or null. */
export const normalizeAction = (item: unknown): Action | null => {
  if (!isRecord(item)) return null;
  if (!isCoordinate(item.x) || !isCoordinate(item.y)) return null;
  if (!oneOf(item.category, ["attacking", "defensive", "duel"] as const)) {
    return null;
  }
  if (!oneOf(item.actionType, ACTION_TYPES_BY_CATEGORY[item.category])) {
    return null;
  }
  if (!oneOf(item.outcome, ACTION_OUTCOMES)) return null;

  return {
    id: createId(),
    x: item.x,
    y: item.y,
    category: item.category,
    actionType: item.actionType,
    outcome: item.outcome,
    timestamp: getTimestamp(item.timestamp),
  };
};

const normalizeChainAction = (
  item: unknown,
  index: number,
): ChainAction | null => {
  if (!isRecord(item)) return null;
  if (!isCoordinate(item.x) || !isCoordinate(item.y)) return null;
  if (!oneOf(item.actionType, CHAIN_ACTION_TYPES)) return null;

  return {
    x: item.x,
    y: item.y,
    actionType: item.actionType,
    sequenceNumber:
      typeof item.sequenceNumber === "number" ? item.sequenceNumber : index,
    // Recalculated so the zone always matches the coordinates
    pitchZone: getZoneFromCoordinates({ x: item.x, y: item.y }),
  };
};

/** Returns a valid PassChain built from an imported item, or null. */
export const normalizePassChain = (item: unknown): PassChain | null => {
  if (!isRecord(item)) return null;
  if (!Array.isArray(item.actions) || item.actions.length === 0) return null;
  if (!oneOf(item.terminationReason, TERMINATION_REASONS)) return null;

  const actions: ChainAction[] = [];
  for (const [index, rawAction] of item.actions.entries()) {
    const action = normalizeChainAction(rawAction, index);
    if (!action) return null;
    actions.push(action);
  }

  return {
    id: createId("chain-"),
    actions,
    terminationReason: item.terminationReason,
    isCompleted: true,
    zones: getZonesFromPassChain(actions),
  };
};

const normalizers = {
  shots: normalizeShot,
  touches: normalizeAction,
  "pass-chains": normalizePassChain,
} as const;

type ImportItem<T extends ImportDataType> = NonNullable<
  ReturnType<(typeof normalizers)[T]>
>;

export type ValidationResult<Item> =
  | { ok: true; items: Item[]; skipped: number }
  | { ok: false; error: string };

export type ImportResult<T extends ImportDataType> = ValidationResult<
  ImportItem<T>
>;

const wrongTabError = (actual: ImportDataType, expected: ImportDataType) =>
  `This file contains ${DATA_TYPE_LABELS[actual]}, not ${DATA_TYPE_LABELS[expected]}. Switch to the ${TAB_LABELS[actual]} tab to import it.`;

/**
 * Validates parsed JSON from an import file against the data type of the
 * current tab. The file may be a bare array (old exports) or a versioned
 * envelope; either way the items are migrated to the current version before
 * they are validated. Invalid items are skipped. If no items are valid but
 * the file matches another data type, the error says which tab to use
 * instead.
 */
export const validateImport = <T extends ImportDataType>(
  data: unknown,
  expectedType: T,
): ImportResult<T> => {
  const unwrapped = unwrapAndMigrate(data, expectedType);
  if (!unwrapped.ok && unwrapped.reason === "wrong-type") {
    return {
      ok: false,
      error: wrongTabError(unwrapped.actualType, expectedType),
    };
  }
  if (!unwrapped.ok || unwrapped.data.length === 0) {
    return { ok: false, error: "The imported file doesn't contain any data." };
  }

  const normalize = normalizers[expectedType] as (
    item: unknown,
  ) => ImportItem<T> | null;
  const items = unwrapped.data
    .map((item) => normalize(item))
    .filter((item): item is ImportItem<T> => item !== null);

  if (items.length > 0) {
    return { ok: true, items, skipped: unwrapped.data.length - items.length };
  }

  // A bare array carries no type, so check whether it fits another tab.
  const otherType = Array.isArray(data)
    ? (Object.keys(normalizers) as ImportDataType[]).find(
        (type) =>
          type !== expectedType &&
          migrate(type, data, 0).some(
            (item) => normalizers[type](item) !== null,
          ),
      )
    : undefined;

  if (otherType) {
    return { ok: false, error: wrongTabError(otherType, expectedType) };
  }

  return {
    ok: false,
    error: `The imported file doesn't contain valid ${DATA_TYPE_LABELS[expectedType]}.`,
  };
};
