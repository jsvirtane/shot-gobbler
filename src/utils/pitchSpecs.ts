import type { Period } from "../types/Match";
import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";

/**
 * Dimensions and rules of a pitch type. Stored coordinates are % of the
 * pitch box (0-100) for every type; these values turn them into metres and
 * set the box shape, the penalty spot and the match clock.
 */
export type PitchSpec = {
  label: string;
  /** Playing area, touchline to touchline, in metres. */
  widthM: number;
  /** Playing area, goal line to goal line, in metres. */
  lengthM: number;
  goalWidthM: number;
  /** Distance of the penalty spot from the goal line. */
  penaltySpotM: number;
  /**
   * Margin drawn around the playing area in the pitch image, in metres. The
   * image's viewBox is (width + 2 * margin) x (length + 2 * margin), with
   * 1 unit = 1 m.
   */
  marginM: number;
  /**
   * Width:height of the pitch box the image is drawn in. The image keeps
   * its own ratio and is centred horizontally when the box is wider.
   */
  boxAspectRatio: number;
  /** Regular length of each period in minutes. */
  periodMinutes: Record<Period, number>;
};

export const PITCH_SPECS: Record<PitchType, PitchSpec> = {
  football: {
    label: "Football",
    widthM: 68,
    lengthM: 105,
    goalWidthM: 7.32,
    penaltySpotM: 11,
    marginM: 3,
    // Slightly wider than the 74:111 image (see pitchGeometry)
    boxAspectRatio: 74 / 110,
    periodMinutes: { "1H": 45, "2H": 45, ET1: 15, ET2: 15, PEN: 0 },
  },
  // FIFA international futsal: 40 x 20 m, 3 x 2 m goals, penalty mark 6 m,
  // two halves of 20 minutes and two extra-time periods of 5 minutes
  futsal: {
    label: "Futsal",
    widthM: 20,
    lengthM: 40,
    goalWidthM: 3,
    penaltySpotM: 6,
    marginM: 2,
    boxAspectRatio: 24 / 44,
    periodMinutes: { "1H": 20, "2H": 20, ET1: 5, ET2: 5, PEN: 0 },
  },
};

export const pitchSpec = (pitch: PitchType = DEFAULT_PITCH_TYPE): PitchSpec =>
  PITCH_SPECS[pitch];
