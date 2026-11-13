import React from "react";
import { Shot } from "../../types/Shot";
import { getShotMarkerStyle } from "../../utils/markerStyle";
import { getShotResult } from "../../utils/shotResult";
import MarkerShape from "../Markers/MarkerShape";
import PitchMarker from "../PitchContainer/PitchMarker";

interface ShotMarkerProps {
  shot: Shot;
  /** Opens the shot for editing. */
  onTap?: () => void;
  /** Long-press drag ended at this displayed point. */
  onMove?: (x: number, y: number) => void;
}

export const ShotMarker: React.FC<ShotMarkerProps> = ({
  shot,
  onTap,
  onMove,
}) => {
  const result = getShotResult(shot);
  const style = getShotMarkerStyle(shot);

  return (
    <PitchMarker
      x={shot.x}
      y={shot.y}
      label={`${shot.shotType} - ${shot.bodyPart} - ${result}${
        shot.playerName ? " - " + shot.playerName : ""
      }`}
      onTap={onTap}
      onMove={onMove}
      testId="shot-marker"
    >
      <MarkerShape {...style} />
    </PitchMarker>
  );
};

export default ShotMarker;
