import { describe, expect, it } from "vitest";
import { TEAM_MARKER_COLORS } from "../constants/markerColors";
import { Action } from "../types/Action";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import { actionSummary, chainSummary, shotSummary } from "./feedbackSummary";

const shot = (fields: Partial<Shot>): Shot =>
  ({
    id: "s",
    x: 50,
    y: 10,
    team: "home",
    bodyPart: "Head",
    shotType: "Open Play",
    result: "Miss",
    isGoal: false,
    timestamp: 0,
    ...fields,
  }) as Shot;

describe("feedback summaries", () => {
  it("sums up a shot like Miss · ARS · Head · #9 · 24'", () => {
    const summary = shotSummary(shot({ playerName: "9", minute: 24 }), {
      home: "Arsenal",
      away: "Chelsea",
    });
    expect(summary.lead).toBe("Miss");
    expect(summary.message).toMatch(/^\S+ · Head · #9 · 24'$/);
    expect(summary.dot).toBe(TEAM_MARKER_COLORS.home);
  });

  it("leaves out what a shot doesn't have, and names set pieces", () => {
    const summary = shotSummary(
      shot({ team: "away", shotType: "Penalty", result: "Goal" }),
      { home: "Home", away: "Away" },
    );
    expect(summary.lead).toBe("Goal");
    expect(summary.message).toBe("Away · Head · Penalty");
  });

  it("sums up a touch with its outcome and minute", () => {
    const summary = actionSummary({
      id: "a",
      x: 1,
      y: 1,
      category: "attacking",
      actionType: "pass",
      outcome: "successful",
      timestamp: 0,
      minute: 5,
    } as Action);
    expect(summary.lead).toBe("Pass");
    expect(summary.message).toContain("5'");
  });

  it("sums up a chain with how it ended and its steps", () => {
    const summary = chainSummary({
      id: "c",
      actions: [{}, {}, {}] as PassChain["actions"],
      terminationReason: "goal",
      isCompleted: true,
      zones: null,
    } as PassChain);
    expect(summary.lead).toBe("Goal");
    expect(summary.message).toBe("Chain · 2 steps");
  });
});
