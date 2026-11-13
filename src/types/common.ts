export type Coordinates = {
  x: number;
  y: number;
};

export type Team = "home" | "away";
/** Fields every recorded event (shot, action, pass chain) can carry. */
export type EventMeta = {
  /**
   * The match the event belongs to. Stored data always has it (a migration
   * assigns old data to the default match); a missing value means the
   * default match.
   */
  matchId?: string;
};
