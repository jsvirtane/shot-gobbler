import React from "react";
import { ActionMarkerColors } from "../../constants/markerColors";
import { Action } from "../../types/Action";
import { isSuccessfulActionOutcome } from "../../utils/isSuccessfulActionOutcome";
import PitchMarker from "../PitchContainer/PitchMarker";

interface ActionMarkerProps {
  action: Action;
  /** Opens the action for editing. */
  onTap?: () => void;
  /** Long-press drag ended at this point. */
  onMove?: (x: number, y: number) => void;
}

export const ActionMarker: React.FC<ActionMarkerProps> = ({
  action,
  onTap,
  onMove,
}) => {
  const getMarkerClasses = () => {
    const isSuccessful = isSuccessfulActionOutcome(action.outcome);
    const outcomeClass = isSuccessful
      ? ActionMarkerColors.outcome.successful
      : ActionMarkerColors.outcome.unsuccessful;

    let categoryClass;
    if (action.category === "attacking") {
      categoryClass = ActionMarkerColors.category.attacking;
    } else if (action.category === "defensive") {
      categoryClass = ActionMarkerColors.category.defensive;
    } else {
      categoryClass = ActionMarkerColors.category.other;
    }

    return `${categoryClass} ${outcomeClass}`;
  };

  return (
    <PitchMarker
      x={action.x}
      y={action.y}
      label={`${action.category} - ${action.actionType} (${action.outcome})`}
      onTap={onTap}
      onMove={onMove}
      testId="action-marker"
    >
      <div
        className={`h-5 w-5 rounded-full ${getMarkerClasses()}`}
        style={{
          borderRadius: "50%", // Explicit for html2canvas iOS compatibility
        }}
      />
    </PitchMarker>
  );
};

export default ActionMarker;
