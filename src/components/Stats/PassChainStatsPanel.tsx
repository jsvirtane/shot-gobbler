import React from "react";
import { PassChain } from "../../types/PassChain";
import { PitchZone } from "../../utils/pitchZones";
import {
  formatTerminationReason,
  getChainStats,
} from "../../utils/stats/chains";
import { formatDecimal, formatPercent } from "../../utils/stats/format";
import { VERTICAL_ZONES } from "../../utils/stats/touches";
import { StatSection, StatTable, StatTile, StatTiles } from "./StatBlocks";

const THIRD_LABELS: Record<PitchZone["vertical"], string> = {
  defensive: "Def",
  midfield: "Mid",
  attacking: "Att",
};

// Build-up order: own third first
const THIRDS = [...VERTICAL_ZONES].reverse();

const PassChainStatsPanel: React.FC<{ passChains: PassChain[] }> = ({
  passChains,
}) => {
  const stats = getChainStats(passChains);

  return (
    <div className="flex flex-col gap-3" data-testid="chain-stats">
      <StatSection title="Totals">
        <StatTiles columns={4}>
          <StatTile label="Chains" value={String(stats.count)} />
          <StatTile
            label="Actions per chain"
            value={formatDecimal(stats.averageLength, 1)}
          />
          <StatTile
            label="Reached final third"
            value={formatPercent(stats.reachedAttackingThirdRate)}
            detail={`${stats.reachedAttackingThird}/${stats.count}`}
          />
          <StatTile
            label="Ended in a shot"
            value={formatPercent(stats.endedInShotRate)}
            detail={`${stats.endedInShot}/${stats.count}`}
          />
        </StatTiles>
      </StatSection>
      <StatSection title="How chains ended">
        {stats.terminations.length === 0 ? (
          <p className="text-sm text-gray-500">No chains recorded yet.</p>
        ) : (
          <StatTable
            label="How chains ended"
            headers={["Ending", "Chains", "Share"]}
            rows={stats.terminations.map((row) => ({
              key: row.reason,
              label: formatTerminationReason(row.reason),
              cells: [row.count, formatPercent(row.share)],
            }))}
          />
        )}
      </StatSection>
      <StatSection title="Start third → end third">
        <StatTable
          label="Start third to end third"
          headers={[
            "Start ↓ / End →",
            ...THIRDS.map((third) => THIRD_LABELS[third]),
          ]}
          rows={THIRDS.map((from) => ({
            key: from,
            label: THIRD_LABELS[from],
            cells: THIRDS.map((to) => {
              const count = stats.zoneToZone[from][to];
              return (
                <span
                  className={count === 0 ? "text-gray-300" : "font-semibold"}
                >
                  {count}
                </span>
              );
            }),
          }))}
        />
      </StatSection>
    </div>
  );
};

export default PassChainStatsPanel;
