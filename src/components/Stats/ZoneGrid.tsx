import React from "react";
import {
  HORIZONTAL_ZONES,
  VERTICAL_ZONES,
  ZoneCounts,
} from "../../utils/stats/touches";
import { pitchSpec } from "../../utils/pitchSpecs";
import { usePitchType } from "../PitchContainer/pitchTypeContext";

interface ZoneGridProps {
  title: string;
  counts: ZoneCounts;
  /** Shading colour as "r, g, b"; busier zones get more of it. */
  shade?: string;
}

// The thirds of pitchZones.ts: 30% / 40% / 30% in both directions
const TRACKS = "3fr 4fr 3fr";

/**
 * A mini pitch split into the 3×3 zones, attacking end at the top, with the
 * number of actions in each zone and darker shading for busier zones.
 */
const ZoneGrid: React.FC<ZoneGridProps> = ({
  title,
  counts,
  shade = "250, 204, 21",
}) => {
  const { widthM, lengthM } = pitchSpec(usePitchType());
  const max = Math.max(
    0,
    ...VERTICAL_ZONES.flatMap((v) => HORIZONTAL_ZONES.map((h) => counts[v][h])),
  );

  return (
    <figure className="flex min-w-0 flex-1 flex-col items-center">
      <div
        role="group"
        aria-label={title}
        style={{
          gridTemplateRows: TRACKS,
          gridTemplateColumns: TRACKS,
          aspectRatio: `${widthM} / ${lengthM}`,
        }}
        className="relative grid w-full max-w-40 overflow-hidden rounded border-2 border-white bg-green-700 outline outline-green-800"
      >
        {/* Halfway line and centre circle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 left-0 border-t border-white/60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-1/6 w-1/4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
        />
        {VERTICAL_ZONES.map((vertical) =>
          HORIZONTAL_ZONES.map((horizontal) => {
            const count = counts[vertical][horizontal];
            const opacity = max > 0 ? (count / max) * 0.75 : 0;
            return (
              <div
                key={`${vertical}-${horizontal}`}
                title={`${vertical} ${horizontal}: ${count}`}
                data-testid={`zone-${vertical}-${horizontal}`}
                className="relative flex items-center justify-center border border-white/30"
                style={{ backgroundColor: `rgba(${shade}, ${opacity})` }}
              >
                <span
                  className={`text-sm font-bold tabular-nums ${
                    count === 0 ? "text-white/50" : "text-white"
                  }`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {count}
                </span>
              </div>
            );
          }),
        )}
      </div>
      <figcaption className="mt-1 text-center text-xs text-gray-600">
        {title}
      </figcaption>
    </figure>
  );
};

export default ZoneGrid;
