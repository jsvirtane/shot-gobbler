import React from "react";
import { Action } from "../../types/Action";
import { getActionMarkerStyle } from "../../utils/markerStyle";
import MarkerShape from "../Markers/MarkerShape";
import Pulse from "../Markers/Pulse";
import PitchMarker from "../PitchContainer/PitchMarker";

interface ActionMarkerProps {
  action: Action;
  /** Opens the action for editing. */
  onTap?: () => void;
  /** Long-press drag ended at this point. */
  onMove?: (x: number, y: number) => void;
  /** Changes when the action was just saved or edited: pulses once. */
  pulseKey?: number;
}

export const ActionMarker: React.FC<ActionMarkerProps> = ({
  action,
  onTap,
  onMove,
  pulseKey,
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
      <Pulse pulseKey={pulseKey}>
        <MarkerShape {...style} />
      </Pulse>
    </PitchMarker>
  );
};

export default ActionMarker;
