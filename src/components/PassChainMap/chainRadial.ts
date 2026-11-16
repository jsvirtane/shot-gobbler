import { ChainActionType, ChainTerminationReason } from "../../types/PassChain";
import { RadialItem, RadialSection } from "../RadialMenu";

/*
 * Options of the pass chain rings: the Step ring (how the ball got to the
 * tapped point, plus End chain), the End ring (how the chain ended) and the
 * ring of a saved chain (Delete). Colours are hex because ring options take
 * any CSS colour; they are the 600 shades of the chain marker colours
 * (`passChainColors.ts`) and of the shot results, so white labels stay
 * readable.
 */

/** A step that adds a point to the chain. */
export type ChainStepType = Exclude<ChainActionType, "start" | "placeholder">;

export type ChainStepItem = RadialItem & { step: ChainStepType };
export type ChainEndItem = RadialItem & { reason: ChainTerminationReason };

/** Id of the Step ring option that opens the End ring. */
export const END_CHAIN_ID = "end-chain";
/** Id of the saved-chain ring's Delete option. */
export const DELETE_CHAIN_ID = "delete-chain";
/** Id of the saved-chain ring's Close option. */
export const CLOSE_CHAIN_ID = "close-chain";

export const STEP_LABELS: Record<ChainStepType, string> = {
  pass: "Pass",
  carry: "Carry",
  cross: "Cross",
  shot: "Shot",
};

const STEP_COLORS: Record<ChainStepType, string> = {
  pass: "#2563eb", // blue-600
  carry: "#16a34a", // green-600
  cross: "#ca8a04", // yellow-600
  shot: "#ea580c", // orange-600
};

const STEP_ORDER: ChainStepType[] = ["pass", "carry", "cross", "shot"];

/**
 * The Step ring: the four steps, with the last-used one outlined, and a
 * separate End chain option (which adds no point).
 */
export const stepSections = (
  lastStep: ChainStepType | null,
): RadialSection<ChainStepItem | RadialItem>[] => [
  {
    label: "Step",
    items: STEP_ORDER.map((step) => ({
      id: step,
      step,
      label: STEP_LABELS[step],
      color: STEP_COLORS[step],
      current: step === lastStep,
    })),
  },
  {
    items: [
      { id: END_CHAIN_ID, label: "End chain", icon: "flag", kind: "danger" },
    ],
  },
];

const SHOT_COLORS = {
  goal: "#16a34a", // green-600
  saved: "#0891b2", // cyan-600
  missed: "#dc2626", // red-600
  blocked: "#4b5563", // gray-600
};
const LOST_COLOR = "#b45309"; // amber-700
const STOPPED_COLOR = "#475569"; // slate-600

type EndOption = [ChainTerminationReason, string, string, string?];

/** End ring groups; every `ChainTerminationReason` appears once. */
const END_GROUPS: { label: string; options: EndOption[] }[] = [
  {
    label: "Shot",
    options: [
      ["goal", "Goal", SHOT_COLORS.goal],
      ["shot_saved", "Saved", SHOT_COLORS.saved, "Shot saved"],
      ["shot_missed", "Missed", SHOT_COLORS.missed, "Shot missed"],
      ["shot_blocked", "Blocked", SHOT_COLORS.blocked, "Shot blocked"],
    ],
  },
  {
    label: "Lost",
    options: [
      ["tackled", "Tackled", LOST_COLOR],
      ["intercepted", "Intercept", LOST_COLOR, "Intercepted"],
      ["clearance", "Clearance", LOST_COLOR],
      ["bad_pass", "Bad pass", LOST_COLOR],
      ["out_of_bounds", "Out", LOST_COLOR, "Out of bounds"],
    ],
  },
  {
    label: "Stopped",
    options: [
      ["fouled", "Fouled", STOPPED_COLOR],
      ["offside", "Offside", STOPPED_COLOR],
      ["manual_end", "Manual end", STOPPED_COLOR],
    ],
  },
];

export const endSections = (): RadialSection<ChainEndItem>[] =>
  END_GROUPS.map((group) => ({
    label: group.label,
    items: group.options.map(([reason, label, color, ariaLabel]) => ({
      id: reason,
      reason,
      label,
      ariaLabel,
      color,
    })),
  }));

/** Ring of a saved chain: Delete, and Close to keep it. */
export const savedChainSections = (): RadialSection[] => [
  {
    items: [
      { id: DELETE_CHAIN_ID, label: "Delete", icon: "trash", kind: "danger" },
    ],
  },
  {
    items: [{ id: CLOSE_CHAIN_ID, label: "Close", icon: "back", kind: "nav" }],
  },
];
