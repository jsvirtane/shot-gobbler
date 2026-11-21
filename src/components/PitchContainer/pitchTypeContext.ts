import { createContext, useContext } from "react";
import { DEFAULT_PITCH_TYPE, PitchType } from "../../types/Pitch";

/**
 * The current match's pitch type. Set once in App so pitches, xG, the
 * penalty spot and match minutes follow the match without passing it
 * through every view.
 */
export const PitchTypeContext = createContext<PitchType>(DEFAULT_PITCH_TYPE);

export const usePitchType = (): PitchType => useContext(PitchTypeContext);
