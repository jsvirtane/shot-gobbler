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
    // Reserved height includes the Shots view's quick entry toggle row
    <PitchContainer
      onCoordinateClick={onPitchClick}
      variant={variant}
      reservedHeight="17.5rem"
    >
      {displayedShots.map((shot) => (
        <ShotMarker key={shot.id} shot={shot} />
      ))}
    </PitchContainer>
  );
};

export default ShotMap;
