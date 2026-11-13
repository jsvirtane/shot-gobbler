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
}

export const TouchMap = ({
  onPitchClick,
  actions,
  onActionClick,
  onActionMove,
}: TouchMapProps) => {
  return (
    // Reserved height includes the match bar and the two-row legend
    <PitchContainer
      onCoordinateClick={onPitchClick}
      reservedHeight="19.25rem"
      legend={<TouchLegend />}
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
