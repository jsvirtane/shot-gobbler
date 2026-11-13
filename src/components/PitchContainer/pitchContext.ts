import { createContext, useContext } from "react";
import { PitchPoint } from "../../utils/pitchView";

export type PitchApi = {
  /**
   * Converts a viewport point to full-pitch % coordinates, clamped to the
   * visible area. Null when the pitch is not mounted.
   */
  toPitchPoint: (clientX: number, clientY: number) => PitchPoint | null;
  /** Ignores the pitch click that may follow the end of a marker drag. */
  suppressNextClick: () => void;
};

export const PitchContext = createContext<PitchApi>({
  toPitchPoint: () => null,
  suppressNextClick: () => {},
});

export const usePitch = (): PitchApi => useContext(PitchContext);
