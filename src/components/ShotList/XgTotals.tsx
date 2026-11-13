import React from "react";
import { Team } from "../../types/common";
import { Shot } from "../../types/Shot";
import { formatXg, totalXg } from "../../utils/xg";

const TEAMS: { team: Team; label: string }[] = [
  { team: "home", label: "Home" },
  { team: "away", label: "Away" },
];

interface XgTotalsProps {
  /** The shots currently shown; teams without shots are left out. */
  shots: Shot[];
}

/** One-line xG total per team, e.g. "Home 1.84 xG · Away 0.62 xG". */
const XgTotals: React.FC<XgTotalsProps> = ({ shots }) => {
  const totals = TEAMS.map(({ team, label }) => ({
    team,
    label,
    shots: shots.filter((shot) => shot.team === team),
  })).filter((t) => t.shots.length > 0);

  if (totals.length === 0) return null;

  return (
    <p className="text-center text-sm text-gray-600" data-testid="xg-totals">
      {totals.map((t, i) => (
        <React.Fragment key={t.team}>
          {i > 0 && " · "}
          <span
            className={t.team === "home" ? "text-blue-700" : "text-red-700"}
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
