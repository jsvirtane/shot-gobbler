import { Team } from "../types/common";

export const TEAMS: readonly Team[] = ["home", "away"];

export const TEAM_ICONS: Record<Team, string> = {
  home: "🏠",
  away: "🚌",
};

/** Default display names; pass custom names (e.g. real team names) instead. */
export const DEFAULT_TEAM_LABELS: Record<Team, string> = {
  home: "Home",
  away: "Away",
};

/** Team choices for a SegmentedControl, e.g. "🏠 Home" / "🚌 Away". */
export const getTeamOptions = (
  labels: Record<Team, string> = DEFAULT_TEAM_LABELS,
) =>
  TEAMS.map((team) => ({
    value: team,
    label: labels[team],
    icon: TEAM_ICONS[team],
  }));

/** "🏠 Home" style text for summaries. */
export const formatTeam = (
  team: Team,
  labels: Record<Team, string> = DEFAULT_TEAM_LABELS,
) => `${TEAM_ICONS[team]} ${labels[team]}`;
