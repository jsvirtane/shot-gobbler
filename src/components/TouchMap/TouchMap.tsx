import React from "react";
import { Action } from "../../types/Action";
import { TouchLegend } from "../MapLegend/MapLegend";
import PitchContainer from "../PitchContainer/PitchContainer";
import ActionMarker from "./ActionMarker";

interface TouchMapProps {
  onPitchClick: (x: number, y: number) => void;
  actions: Action[];
  /** Tap on an action marker. */
  onActionClick?: (action: Action) => void;
  /** An action was dragged to new full-pitch coordinates. */
  onActionMove?: (id: string, x: number, y: number) => void;
  /** Empty-state hint over the pitch. */
  hint?: React.ReactNode;
  /** Focus mode: fill the parent, no legend. */
  focus?: boolean;
  /** The pitch element, e.g. to place a menu at a pitch point. */
  pitchRef?: React.RefObject<HTMLDivElement | null>;
}

export const TouchMap = ({
  onPitchClick,
  actions,
  onActionClick,
  onActionMove,
  hint,
  focus = false,
  pitchRef,
}: TouchMapProps) => {
  return (
    // Reserved height includes the match bar and the two-row legend
    <PitchContainer
      ref={pitchRef as React.Ref<HTMLDivElement>}
      onCoordinateClick={onPitchClick}
      reservedHeight="15.75rem"
      legend={!focus && <TouchLegend />}
      hint={hint}
      fill={focus}
    >
      {actions.map((action) => (
        <ActionMarker
          key={action.id}
          action={action}
          onTap={onActionClick && (() => onActionClick(action))}
          onMove={onActionMove && ((x, y) => onActionMove(action.id, x, y))}
        />
      ))}
    </PitchContainer>
  );
};
export default TouchMap;
