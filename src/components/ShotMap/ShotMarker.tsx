import React from "react";
import { ShotMarkerColors } from "../../constants/markerColors";
import { Shot } from "../../types/Shot";
import { getShotResult } from "../../utils/shotResult";
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

  // Determine color based on team and goal/miss
  const getColorClass = () => {
    const status = result === "Goal" ? "goal" : "miss";
    return ShotMarkerColors[shot.team][status];
  };

  // Determine border style based on shot result
  const getBorderStyle = () => {
    switch (result) {
      case "Saved":
        return "border-2 border-dashed border-black";
      case "Blocked":
        return "border-2 border-dotted border-black";
      case "Goal":
      case "Miss":
      default:
        return "border-2 border-solid border-black";
    }
  };

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
      <div
        className={`h-5 w-5 rounded-full shadow ${getColorClass()} ${getBorderStyle()} opacity-80`}
        style={{
          borderRadius: "50%", // Explicit for html2canvas iOS compatibility
        }}
      />
    </PitchMarker>
  );
};

export default ShotMarker;
