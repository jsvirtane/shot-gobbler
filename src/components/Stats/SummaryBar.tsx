import React from "react";
import { Team } from "../../types/common";
import { TeamNames } from "../../types/Match";
import { Action } from "../../types/Action";
import { PassChain } from "../../types/PassChain";
import { Shot } from "../../types/Shot";
import { getChainStats } from "../../utils/stats/chains";
import { getTeamShotStats } from "../../utils/stats/shots";
import {
  abbreviateTeam,
  chainSummary,
  shotSummary,
  SummaryText,
  touchSummary,
} from "../../utils/stats/summary";
import { getTouchStats } from "../../utils/stats/touches";
import { DEFAULT_TEAM_LABELS, TEAMS } from "../../utils/teamLabels";

const TEAM_TEXT: Record<Team, string> = {
  home: "text-blue-700",
  away: "text-orange-700",
};

/** Full text on wide screens, abbreviated text on phones. */
const Responsive: React.FC<{ text: SummaryText }> = ({ text }) => (
  <>
    <span className="sm:hidden">{text.compact}</span>
    <span className="hidden sm:inline">{text.full}</span>
  </>
);

const lineClass =
  "mb-2 flex min-w-0 justify-center gap-1.5 text-xs tracking-tight whitespace-nowrap text-gray-700 sm:gap-2 sm:text-sm sm:tracking-normal";

/**
 * One line of shot totals per team, e.g.
 * "Arsenal 8 shots · 3 on target · 1 goal · 1.23 xG | Chelsea …".
 */
export const ShotsSummaryBar: React.FC<{
  shots: Shot[];
  teamNames?: TeamNames;
  /** Teams to show; defaults to both. */
  teams?: readonly Team[];
}> = ({ shots, teamNames = DEFAULT_TEAM_LABELS, teams = TEAMS }) => (
  <p className={lineClass} data-testid="stats-summary">
    {teams.map((team, i) => (
      <React.Fragment key={team}>
        {i > 0 && (
          <span aria-hidden="true" className="text-gray-400">
            |
          </span>
        )}
        <span className="min-w-0 truncate">
          <span className={`font-semibold ${TEAM_TEXT[team]}`}>
            <span className="sm:hidden" title={teamNames[team]}>
              {abbreviateTeam(teamNames[team])}
            </span>
            <span className="hidden sm:inline">{teamNames[team]}</span>
          </span>{" "}
          <Responsive text={shotSummary(getTeamShotStats(shots, team))} />
        </span>
      </React.Fragment>
    ))}
  </p>
);

export const TouchesSummaryBar: React.FC<{ actions: Action[] }> = ({
  actions,
}) => (
  <p className={lineClass} data-testid="stats-summary">
    <span className="min-w-0 truncate">
      <Responsive text={touchSummary(getTouchStats(actions))} />
    </span>
  </p>
);

export const ChainsSummaryBar: React.FC<{ passChains: PassChain[] }> = ({
  passChains,
}) => (
  <p className={lineClass} data-testid="stats-summary">
    <span className="min-w-0 truncate">
      <Responsive text={chainSummary(getChainStats(passChains))} />
    </span>
  </p>
);
