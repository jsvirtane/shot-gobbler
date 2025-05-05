import React from "react";
import { Shot } from "../../types/Shot";
import PitchContainer from "../PitchContainer/PitchContainer";
import ShotMarker from "./ShotMarker";

interface ShotMapProps {
  onPitchClick: (x: number, y: number) => void;
  shots: Shot[];
}

export const ShotMap: React.FC<ShotMapProps> = ({
  onPitchClick,
  shots,
}) => {

  return (
    <PitchContainer onCoordinateClick={onPitchClick}>
      {shots.map((shot) => (
        <ShotMarker
          key={shot.id}
          shot={shot}
        />
      ))}
    </PitchContainer>
  );
};

export default ShotMap;
