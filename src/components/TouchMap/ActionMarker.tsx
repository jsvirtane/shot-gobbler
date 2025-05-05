import React from "react";
import { ActionMarkerColors } from "../../constants/markerColors";
import { Action } from "../../types/Action";
import { isSuccessfulActionOutcome } from "../../utils/isSuccessfulActionOutcome";

interface ActionMarkerProps {
  action: Action;
}

export const ActionMarker: React.FC<ActionMarkerProps> = ({ action }) => {
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
    <div
      className={`absolute h-3 w-3 rounded-full ${getMarkerClasses()}`}
      style={{
        left: `${action.x}%`,
        top: `${action.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      title={`${action.category} - ${action.actionType} (${action.outcome})`}
    />
  );
};

export default ActionMarker;
