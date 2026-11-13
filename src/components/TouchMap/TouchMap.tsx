import { Action } from "../../types/Action";
import PitchContainer from "../PitchContainer/PitchContainer";
import ActionMarker from "./ActionMarker";

interface TouchMapProps {
  onPitchClick: (x: number, y: number) => void;
  actions: Action[];
  /** Tap on an action marker. */
  onActionClick?: (action: Action) => void;
  /** An action was dragged to new full-pitch coordinates. */
  onActionMove?: (id: string, x: number, y: number) => void;
}

export const TouchMap = ({
  onPitchClick,
  actions,
  onActionClick,
  onActionMove,
}: TouchMapProps) => {
  return (
    <PitchContainer onCoordinateClick={onPitchClick} reservedHeight="13.5rem">
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
