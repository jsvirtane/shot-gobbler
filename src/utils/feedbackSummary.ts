import {
  ACTION_CATEGORY_MARKER_COLORS,
  TEAM_MARKER_COLORS,
} from "../constants/markerColors";
import { actionTypeInfo, outcomeInfo } from "../constants/actionTypes";
import { Action } from "../types/Action";
import { TeamNames } from "../types/Match";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import { getShotResult } from "./shotResult";
import { formatTerminationReason } from "./stats/chains";
import { shortTeamName } from "./teamLabels";

/** A compact toast line: "**Miss** · ARS · Head · #9 · 24'". */
export type FeedbackSummary = {
  /** Shown in bold first. */
  lead: string;
  /** The rest, joined with " · ". */
  message: string;
  /** Team or category colour, shown as a dot. */
  dot: string;
};

const join = (parts: (string | false | undefined)[]) =>
  parts.filter(Boolean).join(" · ");

const minuteText = (minute?: number) =>
  minute === undefined ? undefined : `${minute}'`;

const playerText = (name?: string) =>
  name ? (/^\d+$/.test(name) ? `#${name}` : name) : undefined;

export const shotSummary = (
  shot: Shot,
  teamNames: TeamNames,
): FeedbackSummary => ({
  lead: getShotResult(shot),
  message: join([
    shortTeamName(teamNames[shot.team]),
    shot.bodyPart,
    shot.shotType !== "Open Play" && shot.shotType,
    playerText(shot.playerName),
    minuteText(shot.minute),
  ]),
  dot: TEAM_MARKER_COLORS[shot.team],
});

export const actionSummary = (action: Action): FeedbackSummary => ({
  lead: actionTypeInfo(action.actionType).label,
  message: join([
    outcomeInfo(action.actionType, action.outcome)?.label,
    minuteText(action.minute),
  ]),
  dot:
    ACTION_CATEGORY_MARKER_COLORS[action.category] ??
    ACTION_CATEGORY_MARKER_COLORS.duel,
});

export const chainSummary = (chain: PassChain): FeedbackSummary => {
  const steps = Math.max(0, chain.actions.length - 1);
  return {
    lead: formatTerminationReason(chain.terminationReason),
    message: join([
      `Chain · ${steps} ${steps === 1 ? "step" : "steps"}`,
      minuteText(chain.minute),
    ]),
    // The termination marker's colours: green for a goal, red otherwise
    dot: chain.terminationReason === "goal" ? "#22c55e" : "#ef4444",
  };
};
