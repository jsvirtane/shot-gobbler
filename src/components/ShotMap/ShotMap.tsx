import React from "react";
import { Shot } from "../../types/Shot";
import {
  displayToStored,
  mirrorToTopHalf,
  PitchVariant,
} from "../../utils/pitchView";
import PitchContainer from "../PitchContainer/PitchContainer";
import ShotMarker from "./ShotMarker";

type ShotMapProps = {
  onPitchClick: (x: number, y: number) => void;
  shots: Shot[];
  variant?: PitchVariant;
  /** Tap on a shot marker; gets the shot as stored. */
  onShotClick?: (shot: Shot) => void;
  /** A shot was dragged; gets its new stored (full-pitch) coordinates. */
  onShotMove?: (id: string, x: number, y: number) => void;
};

export const ShotMap: React.FC<ShotMapProps> = ({
  onPitchClick,
  shots,
  variant = "full",
  onShotClick,
  onShotMove,
}) => {
  return (
    // Reserved height includes the Shots view's quick entry toggle row
    <PitchContainer
      onCoordinateClick={onPitchClick}
      variant={variant}
      reservedHeight="17.5rem"
    >
      {shots.map((shot) => (
        <ShotMarker
          key={shot.id}
          // In half view both teams attack the top goal, so shots stored in
          // the bottom half are mirrored into it (display only)
          shot={variant === "half-top" ? mirrorToTopHalf(shot) : shot}
          onTap={onShotClick && (() => onShotClick(shot))}
          onMove={
            onShotMove &&
            ((x, y) => {
              const stored = displayToStored(shot, { x, y }, variant);
              onShotMove(shot.id, stored.x, stored.y);
            })
          }
        />
      ))}
    </PitchContainer>
  );
};

export default ShotMap;
