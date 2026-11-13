import React from "react";
import { Shot } from "../../types/Shot";
import { mirrorToTopHalf, PitchVariant } from "../../utils/pitchView";
import PitchContainer from "../PitchContainer/PitchContainer";
import ShotMarker from "./ShotMarker";

type ShotMapProps = {
  onPitchClick: (x: number, y: number) => void;
  shots: Shot[];
  variant?: PitchVariant;
};

export const ShotMap: React.FC<ShotMapProps> = ({
  onPitchClick,
  shots,
  variant = "full",
}) => {
  // In half view both teams attack the top goal, so shots stored in the
  // bottom half are mirrored into it (display only; data is unchanged)
  const displayedShots =
    variant === "half-top" ? shots.map(mirrorToTopHalf) : shots;

  return (
    <PitchContainer onCoordinateClick={onPitchClick} variant={variant}>
      {displayedShots.map((shot) => (
        <ShotMarker key={shot.id} shot={shot} />
      ))}
    </PitchContainer>
  );
};

export default ShotMap;
