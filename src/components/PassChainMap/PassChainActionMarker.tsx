import React from "react";
import PitchMarker from "../PitchContainer/PitchMarker";
import { PassChainActionColors } from "../../constants/passChainColors";
import { ChainAction } from "../../types/PassChain";
import { formatPitchZoneCapitalized } from "../../utils/pitchZones";

type PassChainActionMarkerProps = {
  action: ChainAction;
  isCurrentChain?: boolean;
  /** Tap on the marker (selects its chain). */
  onTap?: () => void;
};

export const PassChainActionMarker: React.FC<PassChainActionMarkerProps> = ({
  action,
  isCurrentChain = false,
  onTap,
}) => {
  const getMarkerShape = () => {
    switch (action.actionType) {
      case "pass":
        return "rounded-full";
      case "carry":
        return "rounded-lg";
      case "shot":
        return "rounded-lg";
      case "cross":
        return "rounded-full";
      case "placeholder":
        return "rounded-full";
      default:
        return "rounded-full";
    }
  };

  const isFirstAction = () => {
    return action.sequenceNumber === 1;
  };

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

    return `${size} ${baseColor} ${opacity} ${border} ${shape} ${outline} shadow-lg flex items-center justify-center text-xs`;
  };

  return (
    <PitchMarker
      x={action.x}
      y={action.y}
      label={`${action.actionType} - Sequence ${action.sequenceNumber} - Zone: ${formatPitchZoneCapitalized(action.pitchZone)}`}
      onTap={onTap}
      className="z-[6]"
      testId="chain-action-marker"
    >
      <div
        className={getMarkerClasses()}
        style={{
          borderRadius:
            action.actionType === "pass" ||
            action.actionType === "cross" ||
            action.actionType === "placeholder"
              ? "50%"
              : "0.5rem", // Explicit for html2canvas iOS compatibility
        }}
      >
        <span
          className={`text-xs font-bold ${isCurrentChain ? "text-white" : "text-gray-300"}`}
        >
          {action.actionType === "placeholder" ? "•" : action.sequenceNumber}
        </span>
      </div>
    </PitchMarker>
  );
};

export default PassChainActionMarker;
