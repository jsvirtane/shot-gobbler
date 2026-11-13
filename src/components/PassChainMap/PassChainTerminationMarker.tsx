import React from "react";
import PitchMarker from "../PitchContainer/PitchMarker";
import { ChainAction, ChainTerminationReason } from "../../types/PassChain";
import { formatPitchZoneCapitalized } from "../../utils/pitchZones";

type PassChainTerminationMarkerProps = {
  action: ChainAction;
  terminationReason: ChainTerminationReason;
  isCurrentChain?: boolean;
  /** Tap on the marker (selects its chain). */
  onTap?: () => void;
};

export const PassChainTerminationMarker: React.FC<
  PassChainTerminationMarkerProps
> = ({ action, terminationReason, isCurrentChain = false, onTap }) => {
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

    return `${size} ${baseColor} ${opacity} ${border} rounded-sm shadow-lg flex items-center justify-center text-xs`;
  };

  const getTerminationSymbol = () => {
    if (terminationReason === "goal") {
      return "⚽";
    } else {
      return "✕";
    }
  };

  return (
    <PitchMarker
      x={action.x}
      y={action.y}
      label={`Chain ended: ${terminationReason} - Zone: ${formatPitchZoneCapitalized(action.pitchZone)}`}
      onTap={onTap}
      className="z-[6]"
      testId="chain-termination-marker"
    >
      <div
        className={getMarkerClasses()}
        style={{ borderRadius: "0.125rem" }} // Explicit for html2canvas iOS compatibility
      >
        <span
          className={`text-xs ${isCurrentChain ? "text-white" : "text-gray-300"}`}
        >
          {getTerminationSymbol()}
        </span>
      </div>
    </PitchMarker>
  );
};

export default PassChainTerminationMarker;
