import { Coordinates } from "./common";

// Action categories
export type ActionCategory = "attacking" | "defensive" | "duel";

// Action type definitions
type AttackingAction = "pass" | "cross" | "dribble" | "shot" | "throw-in";
type DefensiveAction =
  | "tackle"
  | "block"
  | "interception"
  | "clearance"
  | "other";
type DuelAction = "aerial" | "ground";

export type ActionType = AttackingAction | DefensiveAction | DuelAction;

// Outcome type definitions
type DefaultOutcome = "successful" | "unsuccessful";

// Attacking action outcomes
type PassOutcome = "successful" | "assist" | "key-pass" | "unsuccessful";
type CrossOutcome = "successful" | "assist" | "key-pass" | "unsuccessful";
type DribbleOutcome = "successful" | "unsuccessful";
type ShotOutcome = "goal" | "on-target" | "off-target" | "blocked";
type ThrowInOutcome = "successful" | "unsuccessful";

type AttackingActionOutcome =
  | PassOutcome
  | CrossOutcome
  | DribbleOutcome
  | ShotOutcome
  | ThrowInOutcome;

// Defensive action outcomes
type TackleOutcome = "won" | "lost";
type BlockOutcome = "posession-won" | "unsuccessful";
type InterceptionOutcome = "successful";
type ClearanceOutcome = "cleared" | "unsuccessful";

type DefensiveActionOutcome =
  | TackleOutcome
  | BlockOutcome
  | InterceptionOutcome
  | ClearanceOutcome
  | DefaultOutcome;

// Duel action outcomes
type DuelActionOutcome = DefaultOutcome;

export type ActionOutcome =
  | AttackingActionOutcome
  | DefensiveActionOutcome
  | DuelActionOutcome;

export type Action = Coordinates & {
  id: string;
  category: ActionCategory;
  actionType: ActionType;
  outcome: ActionOutcome;
  timestamp: number;
};

export const unsuccessfullOutcomes = [
  "unsuccessful",
  "off-target",
  "blocked",
  "lost",
] as const;
