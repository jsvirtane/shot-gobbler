export type BodyPart = "Foot" | "Head" | "Other";
export type ShotType = "Open Play" | "Set Piece" | "Penalty";
export type Team = "home" | "away";

export interface Shot {
  id: string;
  x: number;
  y: number;
  isGoal: boolean;
  bodyPart: BodyPart;
  shotType: ShotType;
  team: Team;
  playerName?: string;
  timestamp: number;
}
