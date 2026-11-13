import { describe, expect, it } from "vitest";
import { Action } from "../../types/Action";
import { getTouchStats, getZoneCounts } from "./touches";

let id = 0;
const action = (
  actionType: Action["actionType"],
  outcome: Action["outcome"],
  extra: Partial<Action> = {},
): Action => {
  const category: Action["category"] = [
    "tackle",
    "block",
    "interception",
    "clearance",
    "other",
  ].includes(actionType)
    ? "defensive"
    : ["aerial", "ground"].includes(actionType)
      ? "duel"
      : "attacking";
  return {
    id: String(id++),
    x: 50,
    y: 50,
    category,
    actionType,
    outcome,
    timestamp: 0,
    ...extra,
  };
};

describe("getTouchStats", () => {
  it("handles no actions", () => {
    const stats = getTouchStats([]);
    expect(stats.total).toBe(0);
    expect(stats.byCategory).toEqual({ attacking: 0, defensive: 0, duel: 0 });
    expect(stats.byActionType).toEqual([]);
    expect(stats.passCompletion).toEqual({
      successful: 0,
      total: 0,
      rate: null,
    });
    expect(stats.defensiveWon.rate).toBeNull();
  });

  it("counts categories and action types with success rates", () => {
    const stats = getTouchStats([
      action("pass", "successful"),
      action("pass", "assist"),
      action("pass", "unsuccessful"),
      action("cross", "key-pass"),
      action("tackle", "won"),
      action("tackle", "lost"),
      action("interception", "successful"),
      action("aerial", "unsuccessful"),
    ]);
    expect(stats.total).toBe(8);
    expect(stats.byCategory).toEqual({ attacking: 4, defensive: 3, duel: 1 });
    expect(stats.byActionType.map((r) => r.actionType)).toEqual([
      "pass",
      "cross",
      "tackle",
      "interception",
      "aerial",
    ]);
    const pass = stats.byActionType[0];
    expect(pass).toMatchObject({ successful: 2, total: 3 });
    expect(pass.rate).toBeCloseTo(2 / 3);
    expect(stats.passCompletion).toEqual({
      successful: 3,
      total: 4,
      rate: 0.75,
    });
    expect(stats.defensiveWon.successful).toBe(2);
    expect(stats.defensiveWon.total).toBe(3);
  });
});

describe("getZoneCounts", () => {
  it("counts actions per 3x3 zone with the attacking third at the top", () => {
    const zones = getZoneCounts([
      action("pass", "successful", { x: 10, y: 10 }),
      action("pass", "successful", { x: 50, y: 50 }),
      action("pass", "successful", { x: 55, y: 45 }),
      action("tackle", "won", { x: 90, y: 90 }),
    ]);
    expect(zones.attacking.left).toBe(1);
    expect(zones.midfield.central).toBe(2);
    expect(zones.defensive.right).toBe(1);
    expect(zones.attacking.right).toBe(0);
  });

  it("keeps defensive zones separately", () => {
    const stats = getTouchStats([
      action("pass", "successful", { x: 90, y: 90 }),
      action("clearance", "cleared", { x: 90, y: 90 }),
    ]);
    expect(stats.zones.defensive.right).toBe(2);
    expect(stats.defensiveZones.defensive.right).toBe(1);
  });
});
