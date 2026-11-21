import { Coordinates, EventMeta, Team } from "./common";

export type BodyPart = "Foot" | "Head" | "Other";
/**
 * "10m Kick" is futsal's second penalty: a direct free kick from the 10 m
 * mark, awarded from a team's sixth accumulated foul in a half.
 */
export type ShotType = "Open Play" | "Set Piece" | "Penalty" | "10m Kick";

/** Shot types taken from a fixed mark, so their position is not chosen. */
export const SPOT_KICK_TYPES = ["Penalty", "10m Kick"] as const;
export type SpotKickType = (typeof SPOT_KICK_TYPES)[number];

export const isSpotKick = (type: ShotType): type is SpotKickType =>
  SPOT_KICK_TYPES.includes(type as SpotKickType);
export type ShotResult = "Goal" | "Miss" | "Saved" | "Blocked";

export type Shot = Coordinates & {
  id: string;
  isGoal: boolean;
  result: ShotResult;
  bodyPart: BodyPart;
  shotType: ShotType;
  team: Team;
  playerName?: string;
  timestamp: number;
} & EventMeta;
