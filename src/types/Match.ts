import type { Team } from "./common";
import type { PitchType } from "./Pitch";
/** Match periods: halves, extra-time halves and the penalty shoot-out. */
export const PERIODS = ["1H", "2H", "ET1", "ET2", "PEN"] as const;
export type Period = (typeof PERIODS)[number];

/**
 * The match clock. It is stored as timestamps rather than a ticking
 * counter, so the elapsed time is right after a reload.
 */
export type MatchClock = {
  period: Period;
  running: boolean;
  /** Epoch ms when the current running stretch started (null when paused). */
  startedAt: number | null;
  /** Time played in this period before the current running stretch. */
  elapsedBeforeStartMs: number;
};

/** A match groups shots, touches and pass chains. */
export type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  /** Match day as YYYY-MM-DD. */
  date: string;
  competition?: string;
  /** Missing for football (the default and every match made before). */
  pitchType?: PitchType;
  createdAt: number;
  /** Missing until the clock is first used. */
  clock?: MatchClock;
};

/** Editable match details (everything except id and creation time). */
export type MatchDetails = Pick<
  Match,
  "homeTeam" | "awayTeam" | "date" | "competition" | "pitchType"
>;

/** Team names shown in place of "Home" / "Away". */
export type TeamNames = Record<Team, string>;

/** Fields every recorded event gets from the current match. */
export type EventStamp = {
  matchId: string;
  /** From the match clock, when it has been used. */
  minute?: number;
  period?: Period;
};

/** Items created before matches existed are assigned to this match. */
export const DEFAULT_MATCH_ID = "default-match";
