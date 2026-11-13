import React from "react";
import {
  ACTION_CATEGORY_MARKER_COLORS,
  LEGEND_NEUTRAL_COLOR,
  TEAM_MARKER_COLORS,
} from "../../constants/markerColors";
import { PassChainActionColors } from "../../constants/passChainColors";
import { ShotResult } from "../../types/Shot";
import { Team } from "../../types/common";
import { getShotMarkerShape, MarkerShapeName } from "../../utils/markerStyle";
import { DEFAULT_TEAM_LABELS, TEAMS } from "../../utils/teamLabels";
import MarkerShape from "../Markers/MarkerShape";

/** Glyph size in the legend (px). */
const GLYPH = 11;

export interface LegendItem {
  key: string;
  glyph: React.ReactNode;
  label: string;
}

const Glyph: React.FC<{
  shape: MarkerShapeName;
  color: string;
  size?: number;
}> = ({ shape, color, size = GLYPH }) => (
  <MarkerShape shape={shape} color={color} size={size} halo={false} />
);

const LegendRow: React.FC<{ items: LegendItem[] }> = ({ items }) => (
  <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
    {items.map((item) => (
      <li
        key={item.key}
        className="flex min-w-0 items-center gap-1"
        data-testid="legend-item"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {item.glyph}
        </span>
        <span className="max-w-[8rem] truncate">{item.label}</span>
      </li>
    ))}
  </ul>
);

interface MapLegendProps {
  /** One list per row. Rows wrap on narrow screens. */
  rows: LegendItem[][];
}

/**
 * Compact key shown under the pitch. It sits inside the captured area, so
 * shared images explain themselves.
 */
export const MapLegend: React.FC<MapLegendProps> = ({ rows }) => (
  <div
    aria-label="Legend"
    role="group"
    data-testid="map-legend"
    className="flex flex-col gap-0.5 px-1 pt-1 text-[11px] leading-4 text-gray-700"
  >
    {rows.map((items, index) => (
      <LegendRow key={index} items={items} />
    ))}
  </div>
);

const SHOT_RESULTS: ShotResult[] = ["Goal", "Saved", "Blocked", "Miss"];

interface ShotLegendProps {
  /** Display names per team, e.g. real team names. */
  teamLabels?: Record<Team, string>;
}

/** Team colours, result shapes and the xG size scale. */
export const ShotLegend: React.FC<ShotLegendProps> = ({
  teamLabels = DEFAULT_TEAM_LABELS,
}) => (
  <MapLegend
    rows={[
      [
        ...TEAMS.map((team) => ({
          key: team,
          glyph: <Glyph shape="circle" color={TEAM_MARKER_COLORS[team]} />,
          label: teamLabels[team],
        })),
        {
          key: "xg",
          glyph: (
            <span className="flex items-end gap-px">
              <Glyph shape="circle" color={LEGEND_NEUTRAL_COLOR} size={5} />
              <Glyph shape="circle" color={LEGEND_NEUTRAL_COLOR} size={9} />
            </span>
          ),
          label: "Bigger = higher xG",
        },
      ],
      SHOT_RESULTS.map((result) => ({
        key: result,
        glyph: (
          <Glyph
            shape={getShotMarkerShape(result)}
            color={LEGEND_NEUTRAL_COLOR}
          />
        ),
        label: result,
      })),
    ]}
  />
);

/** Category colours and filled (successful) vs hollow (unsuccessful). */
export const TouchLegend: React.FC = () => (
  <MapLegend
    rows={[
      [
        {
          key: "attacking",
          glyph: (
            <Glyph
              shape="circle"
              color={ACTION_CATEGORY_MARKER_COLORS.attacking}
            />
          ),
          label: "Attacking",
        },
        {
          key: "defensive",
          glyph: (
            <Glyph
              shape="circle"
              color={ACTION_CATEGORY_MARKER_COLORS.defensive}
            />
          ),
          label: "Defensive",
        },
        {
          key: "duel",
          glyph: (
            // Light yellow needs an edge on the light legend background
            <span
              className="block h-[11px] w-[11px] border border-gray-500"
              style={{
                backgroundColor: ACTION_CATEGORY_MARKER_COLORS.duel,
                borderRadius: "50%",
              }}
            />
          ),
          label: "Duel",
        },
      ],
      [
        {
          key: "successful",
          glyph: <Glyph shape="circle" color={LEGEND_NEUTRAL_COLOR} />,
          label: "Successful",
        },
        {
          key: "unsuccessful",
          glyph: <Glyph shape="ring" color={LEGEND_NEUTRAL_COLOR} />,
          label: "Unsuccessful",
        },
      ],
    ]}
  />
);

const ChainChip: React.FC<{ className: string; round?: boolean }> = ({
  className,
  round = true,
}) => (
  <span
    className={`block h-[11px] w-[11px] ${className}`}
    // Explicit radius for html2canvas iOS compatibility
    style={{ borderRadius: round ? "50%" : "3px" }}
  />
);

/** Pass chain action types and chain ends. */
export const PassChainLegend: React.FC = () => (
  <MapLegend
    rows={[
      [
        {
          key: "pass",
          glyph: <ChainChip className={PassChainActionColors.pass} />,
          label: "Pass",
        },
        {
          key: "carry",
          glyph: (
            <ChainChip className={PassChainActionColors.carry} round={false} />
          ),
          label: "Carry",
        },
        {
          key: "shot",
          glyph: (
            <ChainChip className={PassChainActionColors.shot} round={false} />
          ),
          label: "Shot",
        },
        {
          key: "cross",
          glyph: <ChainChip className={PassChainActionColors.cross} />,
          label: "Cross",
        },
      ],
      [
        {
          key: "start",
          glyph: (
            <ChainChip className="bg-gray-300 outline-2 outline-red-500 outline-double" />
          ),
          label: "Start",
        },
        {
          key: "goal",
          glyph: <ChainChip className="bg-green-500" round={false} />,
          label: "Ended in goal",
        },
        {
          key: "no-goal",
          glyph: <ChainChip className="bg-red-500" round={false} />,
          label: "Ended, no goal",
        },
      ],
    ]}
  />
);

export default MapLegend;
