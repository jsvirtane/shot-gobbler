/** The kind of pitch a match is played on. */
export const PITCH_TYPES = ["football", "futsal"] as const;
export type PitchType = (typeof PITCH_TYPES)[number];

/** Matches saved before pitch types existed are football. */
export const DEFAULT_PITCH_TYPE: PitchType = "football";

export const isPitchType = (value: unknown): value is PitchType =>
  typeof value === "string" && PITCH_TYPES.includes(value as PitchType);
