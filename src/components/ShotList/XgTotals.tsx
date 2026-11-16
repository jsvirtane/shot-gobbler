import React from "react";
import { TeamNames } from "../../types/Match";
import { Shot } from "../../types/Shot";
import { DEFAULT_TEAM_LABELS, TEAMS } from "../../utils/teamLabels";
import { formatXg, totalXg } from "../../utils/xg";

interface XgTotalsProps {
  /** The shots currently shown; teams without shots are left out. */
  shots: Shot[];
  /** Team labels; defaults to Home / Away. */
  teamNames?: TeamNames;
}

/** One-line xG total per team, e.g. "Home 1.84 xG · Away 0.62 xG". */
const XgTotals: React.FC<XgTotalsProps> = ({
  shots,
  teamNames = DEFAULT_TEAM_LABELS,
}) => {
  const totals = TEAMS.map((team) => ({
    team,
    label: teamNames[team],
    shots: shots.filter((shot) => shot.team === team),
  })).filter((t) => t.shots.length > 0);

  if (totals.length === 0) return null;

  return (
    <p className="text-center text-sm text-gray-600" data-testid="xg-totals">
      {totals.map((t, i) => (
        <React.Fragment key={t.team}>
          {i > 0 && " · "}
          <span
            className={t.team === "home" ? "text-blue-700" : "text-orange-700"}
          >
            {t.label}{" "}
            <span className="font-semibold">{formatXg(totalXg(t.shots))}</span>{" "}
            xG
          </span>
        </React.Fragment>
      ))}
    </p>
  );
};

export default XgTotals;
