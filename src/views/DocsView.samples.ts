import { Action } from "../types/Action";
import { ChainAction } from "../types/PassChain";
import { Shot } from "../types/Shot";
import { PitchZone } from "../utils/pitchZones";

// Sample data for markers - positioned at center (50%, 50%)
const centerPosition = { x: 50, y: 50 };

const sampleZone: PitchZone = {
  horizontal: "central",
  vertical: "attacking",
};

// Shot marker samples. Docs centre each marker, but the pitch position
// still sets its xG and therefore its size.
const shotSample = (
  id: string,
  overrides: Partial<Shot> & Pick<Shot, "team" | "result">,
): Shot => ({
  id,
  x: 50,
  y: 12,
  isGoal: overrides.result === "Goal",
  bodyPart: "Foot",
  shotType: "Open Play",
  timestamp: Date.now(),
  ...overrides,
});

export const shotMarkerSamples: Record<string, Shot> = {
  homeGoal: shotSample("sample-1", { team: "home", result: "Goal" }),
  homeSaved: shotSample("sample-2", { team: "home", result: "Saved" }),
  homeBlocked: shotSample("sample-3", { team: "home", result: "Blocked" }),
  homeMiss: shotSample("sample-4", { team: "home", result: "Miss" }),
  awaySaved: shotSample("sample-5", { team: "away", result: "Saved" }),
};

/** The same shot from further out and closer in: size follows xG. */
export const xgSizeSamples: { label: string; shot: Shot }[] = [
  {
    label: "Long range (low xG)",
    shot: shotSample("sample-xg-1", { team: "home", result: "Saved", y: 30 }),
  },
  {
    label: "Edge of the box",
    shot: shotSample("sample-xg-2", { team: "home", result: "Saved", y: 17 }),
  },
  {
    label: "Close range (high xG)",
    shot: shotSample("sample-xg-3", { team: "home", result: "Saved", y: 5 }),
  },
];

// Action marker samples
export const actionMarkerSamples: Record<string, Action> = {
  attackingSuccess: {
    id: "sample-7",
    ...centerPosition,
    category: "attacking",
    actionType: "pass",
    outcome: "successful",
    timestamp: Date.now(),
  },

  attackingUnsuccessful: {
    id: "sample-8",
    ...centerPosition,
    category: "attacking",
    actionType: "pass",
    outcome: "unsuccessful",
    timestamp: Date.now(),
  },

  defensive: {
    id: "sample-9",
    ...centerPosition,
    category: "defensive",
    actionType: "tackle",
    outcome: "won",
    timestamp: Date.now(),
  },

  duel: {
    id: "sample-10",
    ...centerPosition,
    category: "duel",
    actionType: "aerial",
    outcome: "successful",
    timestamp: Date.now(),
  },
};

// Pass chain marker samples
export const passChainMarkerSamples: Record<string, ChainAction> = {
  pass: {
    ...centerPosition,
    sequenceNumber: 1,
    actionType: "pass",
    pitchZone: sampleZone,
  },

  carry: {
    ...centerPosition,
    sequenceNumber: 2,
    actionType: "carry",
    pitchZone: sampleZone,
  },

  shot: {
    ...centerPosition,
    sequenceNumber: 3,
    actionType: "shot",
    pitchZone: sampleZone,
  },

  cross: {
    ...centerPosition,
    sequenceNumber: 4,
    actionType: "cross",
    pitchZone: sampleZone,
  },

  start: {
    ...centerPosition,
    sequenceNumber: 1,
    actionType: "pass",
    pitchZone: {
      horizontal: "central",
      vertical: "defensive",
    },
  },

  terminationGoal: {
    ...centerPosition,
    sequenceNumber: 5,
    actionType: "shot",
    pitchZone: sampleZone,
  },

  terminationNoGoal: {
    ...centerPosition,
    sequenceNumber: 5,
    actionType: "shot",
    pitchZone: sampleZone,
  },
};

// Arrow demonstration actions (for showing different arrow styles)
export const arrowSamples: Record<string, ChainAction> = {
  start: {
    x: 20,
    y: 50,
    sequenceNumber: 1,
    actionType: "pass",
    pitchZone: sampleZone,
  },

  endPass: {
    x: 80,
    y: 50,
    sequenceNumber: 2,
    actionType: "pass",
    pitchZone: sampleZone,
  },

  endCarry: {
    x: 80,
    y: 50,
    sequenceNumber: 2,
    actionType: "carry",
    pitchZone: sampleZone,
  },

  endShot: {
    x: 80,
    y: 50,
    sequenceNumber: 2,
    actionType: "shot",
    pitchZone: sampleZone,
  },

  endCross: {
    x: 80,
    y: 50,
    sequenceNumber: 2,
    actionType: "cross",
    pitchZone: sampleZone,
  },
};
