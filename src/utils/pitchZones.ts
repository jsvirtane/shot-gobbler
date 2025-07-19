import { Coordinates } from "../types/common";
import { ChainAction } from "../types/PassChain";

export type PitchZone = {
  horizontal: "left" | "central" | "right";
  vertical: "defensive" | "midfield" | "attacking";
};

export const getZoneFromCoordinates = ({ x, y }: Coordinates): PitchZone => {
  const horizontal = x < 30 ? "left" : x < 70 ? "central" : "right";
  const vertical = y < 30 ? "attacking" : y < 70 ? "midfield" : "defensive";
  return { horizontal, vertical };
};

export const getZonesFromPassChain = (
  chain: ChainAction[],
): {
  start: PitchZone;
  end: PitchZone;
} | null => {
  if (!chain || chain.length === 0) {
    return null;
  }

  const startAction = chain.reduce((min, current) =>
    current.sequenceNumber < min.sequenceNumber ? current : min,
  );
  const endAction = chain.reduce((max, current) =>
    current.sequenceNumber > max.sequenceNumber ? current : max,
  );

  return {
    start: getZoneFromCoordinates(startAction),
    end: getZoneFromCoordinates(endAction),
  };
};

export const formatPitchZone = (zone: PitchZone): string => {
  return `${zone.vertical} ${zone.horizontal}`;
};

export const formatPitchZoneCapitalized = (zone: PitchZone): string => {
  const formatted = formatPitchZone(zone);
  return formatted
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
