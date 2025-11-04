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

// Shot marker samples
export const shotMarkerSamples: Record<string, Shot> = {
  homeGoal: {
    id: "sample-1",
    ...centerPosition,
    isGoal: true,
    result: "Goal",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "home",
    timestamp: Date.now(),
  },

  homeMiss: {
    id: "sample-2",
    ...centerPosition,
    isGoal: false,
    result: "Miss",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "home",
    timestamp: Date.now(),
  },

  awayGoal: {
    id: "sample-3",
    ...centerPosition,
    isGoal: true,
    result: "Goal",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "away",
    timestamp: Date.now(),
  },

  awayMiss: {
    id: "sample-4",
    ...centerPosition,
    isGoal: false,
    result: "Miss",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "away",
    timestamp: Date.now(),
  },

  saved: {
    id: "sample-5",
    ...centerPosition,
    isGoal: false,
    result: "Saved",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "home",
    timestamp: Date.now(),
  },

  blocked: {
    id: "sample-6",
    ...centerPosition,
    isGoal: false,
    result: "Blocked",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "away",
    timestamp: Date.now(),
  },
};

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
