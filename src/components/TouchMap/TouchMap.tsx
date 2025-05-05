import { Action } from "../../types/Action";
import PitchContainer from "../PitchContainer/PitchContainer";
import ActionMarker from "./ActionMarker";

interface TouchMapProps {
  onPitchClick: (x: number, y: number) => void;
  actions: Action[];
}

export const TouchMap = ({ onPitchClick, actions }: TouchMapProps) => {
  return (
    <PitchContainer onCoordinateClick={onPitchClick}>
      {actions.map((action) => (
        <ActionMarker key={action.id} action={action} />
      ))}
    </PitchContainer>
  );
};
export default TouchMap;
