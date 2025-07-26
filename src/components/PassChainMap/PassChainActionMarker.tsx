import React from "react";
import { PassChainActionColors } from "../../constants/passChainColors";
import { ChainAction } from "../../types/PassChain";
import { formatPitchZoneCapitalized } from "../../utils/pitchZones";

type PassChainActionMarkerProps = {
  action: ChainAction;
  isCurrentChain?: boolean;
};

export const PassChainActionMarker: React.FC<PassChainActionMarkerProps> = ({
  action,
  isCurrentChain = false,
}) => {
  const getMarkerShape = () => {
    switch (action.actionType) {
      case "pass":
        return "rounded-full";
      case "carry":
        return "rounded-lg";
      case "shot":
        return "rounded-none";
      case "cross":
        return "rounded-full";
      default:
        return "rounded-full";
    }
  };

  const isFirstAction = () => {
    return action.sequenceNumber === 1;
  }

  const getMarkerBorder = () => {
    if (isCurrentChain) {
      return "border-2 border-white";
    } else {
      return "border border-gray-500";
    }
  };

  const getMarkerClasses = () => {
    const baseColor = PassChainActionColors[action.actionType];

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
    const shape = getMarkerShape();
    const outline = isFirstAction() ? "outline-double outline-red-500" : "";

    return `absolute ${size} ${baseColor} ${opacity} ${border} ${shape} ${outline} shadow-lg z-10 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs`;
  };

  return (
    <div
      className={getMarkerClasses()}
      style={{
        left: `${action.x}%`,
        top: `${action.y}%`,
      }}
      title={`${action.actionType} - Sequence ${action.sequenceNumber + 1} - Zone: ${formatPitchZoneCapitalized(action.pitchZone)}`}
    >
      <span
        className={`text-xs font-bold ${isCurrentChain ? "text-white" : "text-gray-300"}`}
      >
        {action.sequenceNumber + 1}
      </span>
    </div>
  );
};

export default PassChainActionMarker;
