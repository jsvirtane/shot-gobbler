import React from "react";
import { Action } from "../../types/Action";
import { getActionMarkerStyle } from "../../utils/markerStyle";
import MarkerShape from "../Markers/MarkerShape";
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
  const style = getActionMarkerStyle(action);

  return (
    <PitchMarker
      x={action.x}
      y={action.y}
      label={`${action.category} - ${action.actionType} (${action.outcome})`}
      onTap={onTap}
      onMove={onMove}
      testId="action-marker"
    >
      <MarkerShape {...style} />
    </PitchMarker>
  );
};

export default ActionMarker;
