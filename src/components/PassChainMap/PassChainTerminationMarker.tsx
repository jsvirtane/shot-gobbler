import React from "react";
import { ChainAction, ChainTerminationReason } from "../../types/PassChain";
import { formatPitchZoneCapitalized } from "../../utils/pitchZones";

type PassChainTerminationMarkerProps = {
  action: ChainAction;
  terminationReason: ChainTerminationReason;
  isCurrentChain?: boolean;
};

export const PassChainTerminationMarker: React.FC<
  PassChainTerminationMarkerProps
> = ({ action, terminationReason, isCurrentChain = false }) => {
  const getTerminationColor = () => {
    if (terminationReason === "goal") {
      return "bg-green-500";
    } else {
      return "bg-red-500";
    }
  };

  const getMarkerBorder = () => {
    if (isCurrentChain) {
      return "border-2 border-white";
    } else {
      return "border border-gray-500";
    }
  };

  const getMarkerClasses = () => {
    const baseColor = getTerminationColor();

    const getMarkerStyling = () => {
      if (isCurrentChain) {
        return {
          opacity: "opacity-90",
          size: "h-6 w-6",
        };
      } else {
        return {
          opacity: "opacity-40",
          size: "h-6 w-6",
        };
      }
    };

    const { opacity, size } = getMarkerStyling();
    const border = getMarkerBorder();

    return `absolute ${size} ${baseColor} ${opacity} ${border} rounded-sm shadow-lg z-10 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs`;
  };

  const getTerminationSymbol = () => {
    if (terminationReason === "goal") {
      return "⚽";
    } else {
      return "✕";
    }
  };

  return (
    <div
      className={getMarkerClasses()}
      style={{
        left: `${action.x}%`,
        top: `${action.y}%`,
      }}
      title={`Chain ended: ${terminationReason} - Zone: ${formatPitchZoneCapitalized(action.pitchZone)}`}
    >
      <span
        className={`text-xs ${isCurrentChain ? "text-white" : "text-gray-300"}`}
      >
        {getTerminationSymbol()}
      </span>
    </div>
  );
};

export default PassChainTerminationMarker;
