import { ActionCategory, ActionOutcome, ActionType } from "../types/Action";
import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";
import { pitchSpec } from "../utils/pitchSpecs";

/**
 * The touch tracker's action types and the outcomes of each: the one table
 * that the touch rings, lists, legend and stats are all built from.
 */

export type ActionTypeInfo = {
  value: ActionType;
  category: ActionCategory;
  label: string;
  /** Shorter label where space is tight (the radial menu). */
  short?: string;
};

/** How an outcome reads: a success, a failure, or something special. */
export type OutcomeTone = "success" | "failure" | "special";

export type OutcomeInfo = {
  value: ActionOutcome;
  label: string;
  icon: string;
  tone: OutcomeTone;
};

/** Every action type, by category, in display order. */
export const ACTION_TYPES: readonly ActionTypeInfo[] = [
  { value: "pass", category: "attacking", label: "Pass" },
  { value: "cross", category: "attacking", label: "Cross" },
  { value: "dribble", category: "attacking", label: "Dribble" },
  { value: "shot", category: "attacking", label: "Shot" },
  { value: "throw-in", category: "attacking", label: "Throw-in" },
  { value: "tackle", category: "defensive", label: "Tackle" },
  { value: "block", category: "defensive", label: "Block" },
  {
    value: "interception",
    category: "defensive",
    label: "Interception",
    short: "Intercept",
  },
  {
    value: "clearance",
    category: "defensive",
    label: "Clearance",
    short: "Clear",
  },
  { value: "other", category: "defensive", label: "Other" },
  { value: "aerial", category: "duel", label: "Aerial Duel", short: "Aerial" },
  { value: "ground", category: "duel", label: "Ground Duel", short: "Ground" },
];

/**
 * The action type's info. The throw-in keeps its stored value on every
 * pitch but is labelled as the pitch's restart (a kick-in in futsal).
 */
export const actionTypeInfo = (
  type: ActionType,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): ActionTypeInfo => {
  const info = ACTION_TYPES.find((t) => t.value === type) ?? ACTION_TYPES[0];
  return info.value === "throw-in"
    ? { ...info, label: pitchSpec(pitch).throwInLabel }
    : info;
};

/**
 * The action type as lists and stats name it: the stored value, except
 * the throw-in, which follows the pitch ("Kick-in" in futsal).
 */
export const actionTypeName = (
  type: ActionType,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): string => (type === "throw-in" ? pitchSpec(pitch).throwInLabel : type);

export const actionTypesIn = (category: ActionCategory): ActionTypeInfo[] =>
  ACTION_TYPES.filter((t) => t.category === category);

const SUCCESSFUL: OutcomeInfo = {
  value: "successful",
  label: "Successful",
  icon: "✅",
  tone: "success",
};
const UNSUCCESSFUL: OutcomeInfo = {
  value: "unsuccessful",
  label: "Unsuccessful",
  icon: "❌",
  tone: "failure",
};
const SUCCESS_OR_NOT = [SUCCESSFUL, UNSUCCESSFUL];
const PASS_OUTCOMES: OutcomeInfo[] = [
  SUCCESSFUL,
  UNSUCCESSFUL,
  { value: "assist", label: "Assist", icon: "🅰️", tone: "special" },
  { value: "key-pass", label: "Key Pass", icon: "🔑", tone: "special" },
];

/** Outcomes per action type; the first one is the default. */
export const ACTION_OUTCOMES: Record<ActionType, readonly OutcomeInfo[]> = {
  pass: PASS_OUTCOMES,
  cross: PASS_OUTCOMES,
  dribble: SUCCESS_OR_NOT,
  shot: [
    { value: "goal", label: "Goal", icon: "⚽", tone: "success" },
    { value: "on-target", label: "On Target", icon: "🎯", tone: "special" },
    { value: "off-target", label: "Off Target", icon: "↪️", tone: "failure" },
    { value: "blocked", label: "Blocked", icon: "🛑", tone: "failure" },
  ],
  "throw-in": SUCCESS_OR_NOT,
  tackle: [
    { value: "won", label: "Won", icon: "✅", tone: "success" },
    { value: "lost", label: "Lost", icon: "❌", tone: "failure" },
  ],
  block: [
    {
      value: "possession-won",
      label: "Possession Won",
      icon: "🔄",
      tone: "success",
    },
    UNSUCCESSFUL,
  ],
  interception: [SUCCESSFUL],
  clearance: [
    { value: "cleared", label: "Cleared", icon: "🧹", tone: "success" },
    UNSUCCESSFUL,
  ],
  other: SUCCESS_OR_NOT,
  aerial: SUCCESS_OR_NOT,
  ground: SUCCESS_OR_NOT,
};

export const outcomeInfo = (
  type: ActionType,
  outcome: ActionOutcome,
): OutcomeInfo | undefined =>
  ACTION_OUTCOMES[type].find((o) => o.value === outcome);
