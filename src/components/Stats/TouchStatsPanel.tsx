import React from "react";
import { actionTypeName } from "../../constants/actionTypes";
import { Action, ActionCategory } from "../../types/Action";
import { formatPercent } from "../../utils/stats/format";
import { ACTION_CATEGORIES, getTouchStats } from "../../utils/stats/touches";
import { StatSection, StatTable, StatTile, StatTiles } from "./StatBlocks";
import ZoneGrid from "./ZoneGrid";
import { usePitchType } from "../PitchContainer/pitchTypeContext";

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  attacking: "Attacking",
  defensive: "Defensive",
  duel: "Duels",
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const TouchStatsPanel: React.FC<{ actions: Action[] }> = ({ actions }) => {
  const pitchType = usePitchType();
  const stats = getTouchStats(actions);

  return (
    <div className="flex flex-col gap-3" data-testid="touch-stats">
      <StatSection title="Totals">
        <div className="flex flex-col gap-2">
          <StatTiles columns={3}>
            <StatTile label="Actions" value={String(stats.total)} />
            <StatTile
              label="Pass completion"
              value={formatPercent(stats.passCompletion.rate)}
              detail={`${stats.passCompletion.successful}/${stats.passCompletion.total}`}
            />
            <StatTile
              label="Defensive won"
              value={formatPercent(stats.defensiveWon.rate)}
              detail={`${stats.defensiveWon.successful}/${stats.defensiveWon.total}`}
            />
          </StatTiles>
          <StatTiles columns={3}>
            {ACTION_CATEGORIES.map((category) => (
              <StatTile
                key={category}
                label={CATEGORY_LABELS[category]}
                value={String(stats.byCategory[category])}
              />
            ))}
          </StatTiles>
        </div>
      </StatSection>
      <StatSection title="By action">
        {stats.byActionType.length === 0 ? (
          <p className="text-sm text-gray-500">No actions recorded yet.</p>
        ) : (
          <StatTable
            label="Actions by type"
            headers={["Action", "Total", "Success", "%"]}
            rows={stats.byActionType.map((row) => ({
              key: row.actionType,
              label: capitalize(actionTypeName(row.actionType, pitchType)),
              cells: [row.total, row.successful, formatPercent(row.rate)],
            }))}
          />
        )}
      </StatSection>
      <StatSection title="Zones">
        <p className="mb-2 text-xs text-gray-500">Attacking towards the top</p>
        <div className="flex gap-4">
          <ZoneGrid title="All actions" counts={stats.zones} />
          <ZoneGrid
            title="Defensive actions"
            counts={stats.defensiveZones}
            // Defensive marker red (red-700)
            shade="185, 28, 28"
          />
        </div>
      </StatSection>
    </div>
  );
};

export default TouchStatsPanel;
