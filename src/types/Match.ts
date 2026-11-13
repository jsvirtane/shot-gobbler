import type { Team } from "./common";

/** A match groups shots, touches and pass chains. */
export type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  /** Match day as YYYY-MM-DD. */
  date: string;
  competition?: string;
  createdAt: number;
};

/** Editable match details (everything except id and creation time). */
export type MatchDetails = Pick<
  Match,
  "homeTeam" | "awayTeam" | "date" | "competition"
>;

/** Team names shown in place of "Home" / "Away". */
export type TeamNames = Record<Team, string>;

/** Fields every recorded event gets from the current match. */
export type EventStamp = {
  matchId: string;
};

/** Items created before matches existed are assigned to this match. */
export const DEFAULT_MATCH_ID = "default-match";
