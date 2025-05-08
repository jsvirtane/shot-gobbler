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

  return (
    <div
      className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full border border-black shadow ${getColorClass()} z-10 opacity-80`}
      style={{
        left: `${shot.x}%`,
        top: `${shot.y}%`,
      }}
      title={`${shot.shotType} - ${shot.bodyPart}${
        shot.playerName ? " - " + shot.playerName : ""
      }`}
    ></div>
  );
};

export default ShotMarker;
