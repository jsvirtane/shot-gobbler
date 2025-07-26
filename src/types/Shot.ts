import { Coordinates, Team } from "./common";

export type BodyPart = "Foot" | "Head" | "Other";
export type ShotType = "Open Play" | "Set Piece" | "Penalty";
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
};
