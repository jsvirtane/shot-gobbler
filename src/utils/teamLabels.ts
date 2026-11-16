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

/**
 * Labels from a match's team names; an empty name falls back to the
 * default label.
 */
export const getTeamLabels = (match?: {
  homeTeam: string;
  awayTeam: string;
}): Record<Team, string> => ({
  home: match?.homeTeam.trim() || DEFAULT_TEAM_LABELS.home,
  away: match?.awayTeam.trim() || DEFAULT_TEAM_LABELS.away,
});

/** Team choices for a SegmentedControl, e.g. "🏠 Home" / "🚌 Away". */
export const getTeamOptions = (
  labels: Record<Team, string> = DEFAULT_TEAM_LABELS,
) =>
  TEAMS.map((team) => ({
    value: team,
    label: labels[team],
    icon: TEAM_ICONS[team],
  }));

/**
 * Short team name for tight spots (the radial menu centre, the focus bar):
 * names up to five letters as they are, longer ones as three capitals,
 * e.g. "Arsenal" -> "ARS".
 */
export const shortTeamName = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.length <= 5 ? trimmed : trimmed.slice(0, 3).toUpperCase();
};

/** "🏠 Home" style text for summaries. */
export const formatTeam = (
  team: Team,
  labels: Record<Team, string> = DEFAULT_TEAM_LABELS,
) => `${TEAM_ICONS[team]} ${labels[team]}`;
