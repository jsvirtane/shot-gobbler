import React, { useRef } from "react";
import { TEAM_MARKER_COLORS } from "../../constants/markerColors";
import { Shot } from "../../types/Shot";
import { Team } from "../../types/common";
import { Pulse, pulseKeyFor } from "../../utils/feedback";
import {
  displayToStored,
  PitchPoint,
  PitchVariant,
  storedToDisplay,
  toVisibleShare,
} from "../../utils/pitchView";
import { ShotLegend } from "../MapLegend/MapLegend";
import PitchContainer from "../PitchContainer/PitchContainer";
import PitchMarker from "../PitchContainer/PitchMarker";
import ShotMarker from "./ShotMarker";

/** A point in viewport px, e.g. where to open a radial menu. */
export type ScreenPoint = { x: number; y: number };

type ShotMapProps = {
  /**
   * Tap on the pitch: full-pitch % coordinates as displayed, and the tap
   * point in viewport px.
   */
  onPitchClick: (x: number, y: number, screen: ScreenPoint) => void;
  shots: Shot[];
  variant?: PitchVariant;
  /** Tap on a shot marker; gets the shot as stored and its viewport point. */
  onShotClick?: (shot: Shot, screen: ScreenPoint) => void;
  /** A shot was dragged; gets its new stored (full-pitch) coordinates. */
  onShotMove?: (id: string, x: number, y: number) => void;
  /** Team names for the legend; defaults to Home / Away. */
  teamLabels?: Record<Team, string>;
  /** Shown between the pitch and the legend. */
  belowPitch?: React.ReactNode;
  /** Empty-state hint over the pitch. */
  hint?: React.ReactNode;
  /** Focus mode: fill the parent, no legend or rows under the pitch. */
  focus?: boolean;
  /** Labels inside the pitch at the goal ends. */
  endLabels?: { top?: React.ReactNode; bottom?: React.ReactNode };
  /** A shot being recorded (stored coordinates), marked on the pitch. */
  pending?: PitchPoint & { team: Team };
  /** The shot saved or edited last, whose marker pulses once. */
  pulse?: Pulse | null;
};

export const ShotMap: React.FC<ShotMapProps> = ({
  onPitchClick,
  shots,
  variant = "full",
  onShotClick,
  onShotMove,
  teamLabels,
  belowPitch,
  hint,
  focus = false,
  endLabels,
  pending,
  pulse,
}) => {
  const pitchRef = useRef<HTMLDivElement>(null);

  // Viewport px of a displayed full-pitch % point
  const toScreen = (point: PitchPoint): ScreenPoint => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const share = toVisibleShare(point, variant);
    return {
      x: rect.left + share.x * rect.width,
      y: rect.top + share.y * rect.height,
    };
  };

  const pendingShown = pending && storedToDisplay(pending, variant);

  return (
    // Reserved height includes the match bar and the two-row legend
    <PitchContainer
      ref={pitchRef}
      onCoordinateClick={(x, y) => onPitchClick(x, y, toScreen({ x, y }))}
      variant={variant}
      reservedHeight="21.75rem"
      legend={!focus && <ShotLegend teamLabels={teamLabels} />}
      belowPitch={!focus && belowPitch}
      hint={hint}
      fill={focus}
      endLabels={endLabels}
    >
      {shots.map((shot) => {
        // In half view both teams attack the same goal, so shots at the
        // other goal are mirrored (display only)
        const shown = storedToDisplay(shot, variant);
        return (
          <ShotMarker
            key={shot.id}
            shot={shown}
            pulseKey={pulseKeyFor(pulse, shot.id)}
            onTap={onShotClick && (() => onShotClick(shot, toScreen(shown)))}
            onMove={
              onShotMove &&
              ((x, y) => {
                const stored = displayToStored(shot, { x, y }, variant);
                onShotMove(shot.id, stored.x, stored.y);
              })
            }
          />
        );
      })}
      {pendingShown && (
        <PitchMarker
          x={pendingShown.x}
          y={pendingShown.y}
          label="New shot"
          className="z-10"
          testId="pending-shot"
        >
          <span
            className="block h-4 w-4 animate-pulse rounded-full border-[3px] bg-white/60 motion-reduce:animate-none"
            style={{ borderColor: TEAM_MARKER_COLORS[pendingShown.team] }}
          />
        </PitchMarker>
      )}
    </PitchContainer>
  );
};

export default ShotMap;
