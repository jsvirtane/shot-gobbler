import { PitchZone } from "../utils/pitchZones";
import { Coordinates } from "./common";

export type ChainActionType =
  | "pass"
  | "carry"
  | "shot"
  | "cross"
  | "start"
  | "placeholder";

export type ChainTerminationReason =
  | "goal"
  | "shot_saved"
  | "shot_missed"
  | "shot_blocked"
  | "tackled"
  | "intercepted"
  | "clearance"
  | "bad_pass"
  | "out_of_bounds"
  | "fouled"
  | "offside"
  | "manual_end";

export type ChainAction = Coordinates & {
  sequenceNumber: number;
  actionType: ChainActionType;
  pitchZone: PitchZone;
};

export type PassChain = {
  id: string;
  actions: ChainAction[];
  terminationReason: ChainTerminationReason;
  isCompleted: boolean;
  zones: {
    start: PitchZone;
    end: PitchZone;
  } | null;
};
