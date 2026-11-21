import React from "react";
import { Shot } from "../../types/Shot";
import { getShotMarkerStyle } from "../../utils/markerStyle";
import { getShotResult } from "../../utils/shotResult";
import MarkerShape from "../Markers/MarkerShape";
import Pulse from "../Markers/Pulse";
import PitchMarker from "../PitchContainer/PitchMarker";
import { usePitchType } from "../PitchContainer/pitchTypeContext";

interface ShotMarkerProps {
  shot: Shot;
  /** Opens the shot for editing. */
  onTap?: () => void;
  /** Long-press drag ended at this displayed point. */
  onMove?: (x: number, y: number) => void;
  /** Changes when the shot was just saved or edited: pulses once. */
  pulseKey?: number;
}

export const ShotMarker: React.FC<ShotMarkerProps> = ({
  shot,
  onTap,
  onMove,
  pulseKey,
}) => {
  const result = getShotResult(shot);
  const pitchType = usePitchType();
  const style = getShotMarkerStyle(shot, pitchType);

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
      <Pulse pulseKey={pulseKey}>
        <MarkerShape {...style} />
      </Pulse>
    </PitchMarker>
  );
};

export default ShotMarker;
