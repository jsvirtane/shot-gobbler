import React from "react";
import { ShotMarkerColors } from "../../constants/markerColors";
import { Shot } from "../../types/Shot";

interface ShotMarkerProps {
  shot: Shot;
}

export const ShotMarker: React.FC<ShotMarkerProps> = ({ shot }) => {
  // Determine color based on team and goal/miss
  const getColorClass = () => {
    const status = shot.isGoal ? "goal" : "miss";
    return ShotMarkerColors[shot.team][status];
  };

  // Determine border style based on shot result
  const getBorderStyle = () => {
    switch (shot.result) {
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
      className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full shadow ${getColorClass()} ${getBorderStyle()} z-10 opacity-80`}
      style={{
        left: `${shot.x}%`,
        top: `${shot.y}%`,
      }}
      title={`${shot.shotType} - ${shot.bodyPart} - ${shot.result}${
        shot.playerName ? " - " + shot.playerName : ""
      }`}
    ></div>
  );
};

export default ShotMarker;
