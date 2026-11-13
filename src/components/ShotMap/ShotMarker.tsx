import React from "react";
import { ShotMarkerColors } from "../../constants/markerColors";
import { Shot } from "../../types/Shot";
import { getShotResult } from "../../utils/shotResult";

interface ShotMarkerProps {
  shot: Shot;
}

export const ShotMarker: React.FC<ShotMarkerProps> = ({ shot }) => {
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
    <div
      className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full shadow ${getColorClass()} ${getBorderStyle()} opacity-80`}
      style={{
        left: `${shot.x}%`,
        top: `${shot.y}%`,
        borderRadius: "50%", // Explicit for html2canvas iOS compatibility
      }}
      title={`${shot.shotType} - ${shot.bodyPart} - ${result}${
        shot.playerName ? " - " + shot.playerName : ""
      }`}
    ></div>
  );
};

export default ShotMarker;
