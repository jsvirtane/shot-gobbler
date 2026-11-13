import React from "react";
import { Team } from "../../types/common";
import { TeamNames } from "../../types/Match";
import { Shot } from "../../types/Shot";
import { PERIOD_LABELS } from "../../utils/matchClock";
import {
  formatDecimal,
  formatPercent,
  formatSigned,
} from "../../utils/stats/format";
import {
  getShotStats,
  PeriodKey,
  ShotBreakdownRow,
  TeamShotStats,
} from "../../utils/stats/shots";
import { DEFAULT_TEAM_LABELS, TEAMS } from "../../utils/teamLabels";
import { formatXg } from "../../utils/xg";
import { StatSection, StatTable } from "./StatBlocks";

interface ShotStatsPanelProps {
  /** Shots of the current match, already filtered by team. */
  shots: Shot[];
  teamNames?: TeamNames;
  /** Teams to show (the team filter); defaults to both. */
  teams?: readonly Team[];
}

const TEAM_TEXT: Record<Team, string> = {
  home: "text-blue-700",
  away: "text-orange-700",
};

const METRICS: { label: string; value: (s: TeamShotStats) => string }[] = [
  { label: "Shots", value: (s) => String(s.shots) },
  { label: "On target", value: (s) => String(s.onTarget) },
  { label: "Goals", value: (s) => String(s.goals) },
  { label: "Saved", value: (s) => String(s.saved) },
  { label: "Blocked", value: (s) => String(s.blocked) },
  { label: "Off target", value: (s) => String(s.offTarget) },
  { label: "On target %", value: (s) => formatPercent(s.onTargetRate) },
  { label: "Conversion %", value: (s) => formatPercent(s.conversionRate) },
  { label: "xG", value: (s) => formatXg(s.xg) },
  { label: "xG per shot", value: (s) => formatDecimal(s.xgPerShot) },
  { label: "Goals − xG", value: (s) => formatSigned(s.goalsMinusXg) },
];

/** "5 (1)": shots with goals in brackets. */
const shotsAndGoals = (shots: number, goals: number) =>
  shots === 0 ? "0" : `${shots} (${goals})`;

const ShotStatsPanel: React.FC<ShotStatsPanelProps> = ({
  shots,
  teamNames = DEFAULT_TEAM_LABELS,
  teams = TEAMS,
}) => {
  const stats = getShotStats(shots);
  const teamHeaders = teams.map((team) => (
    <span key={team} className={`font-semibold ${TEAM_TEXT[team]}`}>
      {teamNames[team]}
    </span>
  ));

  const breakdownTable = <K extends string>(
    label: string,
    rows: ShotBreakdownRow<K>[],
    rowLabel: (key: K) => string = (key) => key,
  ) => (
    <StatTable
      label={label}
      headers={[label, ...teamHeaders]}
      rows={rows.map((row) => ({
        key: row.key,
        label: rowLabel(row.key),
        cells: teams.map((team) =>
          shotsAndGoals(row.byTeam[team].shots, row.byTeam[team].goals),
        ),
      }))}
    />
  );

  return (
    <div className="flex flex-col gap-3" data-testid="shot-stats">
      <StatSection title="Totals">
        <StatTable
          label="Shot totals"
          headers={["", ...teamHeaders]}
          rows={METRICS.map((metric) => ({
            key: metric.label,
            label: metric.label,
            cells: teams.map((team) => metric.value(stats.teams[team])),
          }))}
        />
      </StatSection>
      <StatSection title="Breakdown">
        <p className="mb-2 text-xs text-gray-500">Shots (goals)</p>
        <div className="flex flex-col gap-3">
          {breakdownTable("Body part", stats.byBodyPart)}
          {breakdownTable("Shot type", stats.byShotType)}
          {stats.byPeriod.length > 0 &&
            breakdownTable("Period", stats.byPeriod, (key: PeriodKey) =>
              key === "unknown" ? "No time" : PERIOD_LABELS[key],
            )}
        </div>
      </StatSection>
    </div>
  );
};

export default ShotStatsPanel;
