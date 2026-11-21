import {
  ACTION_OUTCOMES,
  actionTypeInfo,
  ActionTypeInfo,
  actionTypesIn,
  OutcomeTone,
} from "../../constants/actionTypes";
import {
  Action,
  ActionCategory,
  ActionOutcome,
  ActionType,
} from "../../types/Action";
import { RadialItem, RadialSection } from "../RadialMenu";
import { DEFAULT_PITCH_TYPE, PitchType } from "../../types/Pitch";

/*
 * The rings of the touch tracker's radial menu, built from the action-type
 * table. Pure, so the steps can be tested without rendering.
 */

/** Which ring is showing. */
export type TouchStep =
  | { ring: "action" }
  | { ring: "more" }
  | { ring: "outcome"; actionType: ActionType }
  | { ring: "minute"; value: string };

/** What a ring option does when picked. */
export type TouchPick =
  | { type: "action"; actionType: ActionType }
  | { type: "outcome"; outcome: ActionOutcome }
  | { type: "more" }
  | { type: "back" }
  | { type: "move" }
  | { type: "minute" }
  | { type: "delete" }
  | { type: "digit"; digit: string }
  | { type: "erase" }
  | { type: "done" };

export type TouchItem = RadialItem & { pick: TouchPick };

/** Segment fills from the theme's category families (hex: SVG fill). */
export const CATEGORY_RING_COLORS: Record<ActionCategory, string> = {
  attacking: "#2563eb", // attacking-600 (blue-600)
  defensive: "#b91c1c", // defensive-700 (red-700)
  duel: "#a16207", // duel-700 (yellow-700), dark enough for white text
};

export const CATEGORY_RING_LABELS: Record<ActionCategory, string> = {
  attacking: "Attack",
  defensive: "Defend",
  duel: "Duel",
};

export const OUTCOME_RING_COLORS: Record<OutcomeTone, string> = {
  success: "#16a34a", // green-600
  failure: "#dc2626", // red-600
  special: "#7c3aed", // violet-600
};

/** Shown on the main ring; the rest are under More. */
const MAIN_TYPES: Record<ActionCategory, ActionType[]> = {
  attacking: ["pass", "cross", "dribble"],
  defensive: ["tackle", "interception", "clearance"],
  duel: ["aerial", "ground"],
};

const isMain = (type: ActionType) =>
  Object.values(MAIN_TYPES).some((types) => types.includes(type));

/** Action types under More: every type not on the main ring. */
export const MORE_TYPES: ActionType[] = (
  ["attacking", "defensive", "duel"] as const
)
  .flatMap((c) => actionTypesIn(c))
  .map((t) => t.value)
  .filter((t) => !isMain(t));

/** Most digits the minute dial takes (e.g. 120). */
export const MINUTE_MAX_DIGITS = 3;

const BACK: TouchItem = {
  id: "back",
  label: "Back",
  icon: "back",
  kind: "nav",
  pick: { type: "back" },
};

const actionItem = (info: ActionTypeInfo, editing?: Action): TouchItem => ({
  id: info.value,
  label: info.short ?? info.label,
  ariaLabel: info.label,
  color: CATEGORY_RING_COLORS[info.category],
  current: editing?.actionType === info.value,
  pick: { type: "action", actionType: info.value },
});

const editSection = (editing: Action): RadialSection<TouchItem> => ({
  label: "Edit",
  items: [
    {
      id: "move",
      label: "Move",
      icon: "move",
      kind: "nav",
      pick: { type: "move" },
    },
    {
      id: "minute",
      label: editing.minute !== undefined ? `${editing.minute}'` : "Minute",
      ariaLabel:
        editing.minute !== undefined
          ? `Minute ${editing.minute}`
          : "Minute, not set",
      kind: "nav",
      pick: { type: "minute" },
    },
    {
      id: "delete",
      label: "Delete",
      icon: "trash",
      kind: "danger",
      pick: { type: "delete" },
    },
  ],
});

/** The sections of a ring; editing adds the Edit section and outlines. */
export const touchSections = (
  step: TouchStep,
  editing?: Action,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): RadialSection<TouchItem>[] => {
  switch (step.ring) {
    case "action": {
      const category = (c: ActionCategory): RadialSection<TouchItem> => ({
        label: CATEGORY_RING_LABELS[c],
        items: MAIN_TYPES[c].map((type) =>
          actionItem(actionTypeInfo(type, pitch), editing),
        ),
      });
      const more: RadialSection<TouchItem> = {
        items: [
          {
            id: "more",
            label: "More",
            icon: "more",
            kind: "nav",
            ariaLabel: "More actions",
            // Outlined when the action being edited is under More
            current: editing ? !isMain(editing.actionType) : false,
            pick: { type: "more" },
          },
        ],
      };
      // More sits among the actions (between Defend and Duel), so the
      // Edit section never has it as a neighbour
      return [
        category("attacking"),
        category("defensive"),
        more,
        category("duel"),
        ...(editing ? [editSection(editing)] : []),
      ];
    }
    case "more":
      return [
        {
          label: "More",
          items: MORE_TYPES.map((type) =>
            actionItem(actionTypeInfo(type, pitch), editing),
          ),
        },
        { items: [BACK] },
      ];
    case "outcome":
      return [
        {
          label: "Outcome",
          items: ACTION_OUTCOMES[step.actionType].map((o) => ({
            id: o.value,
            label: o.label,
            color: OUTCOME_RING_COLORS[o.tone],
            current:
              editing?.actionType === step.actionType &&
              editing.outcome === o.value,
            pick: { type: "outcome", outcome: o.value },
          })),
        },
        { items: [BACK] },
      ];
    case "minute":
      return [
        {
          items: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(
            (digit) => ({
              id: `digit-${digit}`,
              label: digit,
              kind: "nav" as const,
              pick: { type: "digit" as const, digit },
            }),
          ),
        },
        {
          items: [
            BACK,
            {
              id: "erase",
              label: "Del",
              ariaLabel: "Delete digit",
              icon: "erase",
              kind: "danger",
              pick: { type: "erase" },
            },
            {
              id: "done",
              label: "Done",
              icon: "check",
              pick: { type: "done" },
            },
          ],
        },
      ];
  }
};

/** Adds a digit to the minute being typed, up to MINUTE_MAX_DIGITS. */
export const typeDigit = (value: string, digit: string): string => {
  if (value.length >= MINUTE_MAX_DIGITS) return value;
  // No leading zeros: "0" then "7" is 7
  return value === "0" ? digit : value + digit;
};
