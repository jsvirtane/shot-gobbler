import { describe, expect, it } from "vitest";
import { Shot, ShotResult } from "../../types/Shot";
import { shotXg } from "../xg";
import { formatPercent } from "./format";
import {
  getEventPeriod,
  getShotStats,
  getShotTotals,
  getTeamShotStats,
} from "./shots";

let id = 0;
const shot = (
  team: Shot["team"],
  result: ShotResult,
  extra: Partial<Shot> = {},
): Shot => ({
  id: String(id++),
  x: 50,
  y: 15,
  team,
  result,
  isGoal: result === "Goal",
  bodyPart: "Foot",
  shotType: "Open Play",
  timestamp: 0,
  ...extra,
});

describe("getShotTotals", () => {
  it("is all zero without shots", () => {
    expect(getShotTotals([])).toEqual({
      shots: 0,
      onTarget: 0,
      goals: 0,
      saved: 0,
      blocked: 0,
      offTarget: 0,
      xg: 0,
    });
  });

  it("counts each result; on target is goals plus saves", () => {
    const totals = getShotTotals([
      shot("home", "Goal"),
      shot("home", "Saved"),
      shot("home", "Saved"),
      shot("home", "Blocked"),
      shot("home", "Miss"),
    ]);
    expect(totals).toMatchObject({
      shots: 5,
      onTarget: 3,
      goals: 1,
      saved: 2,
      blocked: 1,
      offTarget: 1,
    });
  });

  it("falls back to isGoal for shots without a result", () => {
    const legacy = { ...shot("home", "Goal"), result: undefined };
    const totals = getShotTotals([legacy as unknown as Shot]);
    expect(totals.goals).toBe(1);
  });
});

describe("getTeamShotStats", () => {
  const shots = [
    shot("home", "Goal"),
    shot("home", "Saved"),
    shot("home", "Miss"),
    shot("home", "Blocked"),
    shot("away", "Miss", { shotType: "Penalty" }),
  ];

  it("computes rates and xG for one team", () => {
    const home = getTeamShotStats(shots, "home");
    expect(home.shots).toBe(4);
    expect(home.onTargetRate).toBe(0.5);
    expect(home.conversionRate).toBe(0.25);
    const xg = shots.slice(0, 4).reduce((sum, s) => sum + shotXg(s), 0);
    expect(home.xg).toBeCloseTo(xg);
    expect(home.xgPerShot).toBeCloseTo(xg / 4);
    expect(home.goalsMinusXg).toBeCloseTo(1 - xg);
  });

  it("uses the penalty xG for penalties", () => {
    const away = getTeamShotStats(shots, "away");
    expect(away.xg).toBeCloseTo(0.76);
    expect(away.goalsMinusXg).toBeCloseTo(-0.76);
  });

  it("has no rates for a team without shots", () => {
    const stats = getTeamShotStats([], "home");
    expect(stats.onTargetRate).toBeNull();
    expect(stats.conversionRate).toBeNull();
    expect(stats.xgPerShot).toBeNull();
    expect(stats.goalsMinusXg).toBeNull();
    expect(formatPercent(stats.onTargetRate)).toBe("–");
  });
});

describe("getShotStats", () => {
  it("breaks shots down by body part and shot type per team", () => {
    const stats = getShotStats([
      shot("home", "Goal", { bodyPart: "Head" }),
      shot("home", "Miss", { bodyPart: "Head", shotType: "Set Piece" }),
      shot("away", "Goal", { shotType: "Penalty" }),
    ]);
    const head = stats.byBodyPart.find((r) => r.key === "Head")!;
    expect(head.byTeam.home).toMatchObject({ shots: 2, goals: 1 });
    expect(head.byTeam.away.shots).toBe(0);
    expect(stats.byBodyPart.map((r) => r.key)).toEqual([
      "Foot",
      "Head",
      "Other",
    ]);
    const penalty = stats.byShotType.find((r) => r.key === "Penalty")!;
    expect(penalty.byTeam.away).toMatchObject({ shots: 1, goals: 1 });
  });

  it("has no period breakdown without minutes", () => {
    expect(getShotStats([shot("home", "Goal")]).byPeriod).toEqual([]);
  });

  it("breaks shots down by period when minutes exist", () => {
    const stats = getShotStats([
      shot("home", "Goal", { minute: 12, period: "1H" }),
      shot("away", "Miss", { minute: 60 }),
      shot("away", "Miss"),
    ]);
    expect(stats.byPeriod.map((r) => r.key)).toEqual(["1H", "2H", "unknown"]);
    expect(stats.byPeriod[1].byTeam.away.shots).toBe(1);
  });

  it("works without shots", () => {
    const stats = getShotStats([]);
    expect(stats.teams.home.shots).toBe(0);
    expect(stats.teams.away.conversionRate).toBeNull();
  });
});

describe("getEventPeriod", () => {
  it("prefers the stored period and derives one from the minute", () => {
    expect(getEventPeriod({ minute: 50, period: "1H" })).toBe("1H");
    expect(getEventPeriod({ minute: 45 })).toBe("1H");
    expect(getEventPeriod({ minute: 46 })).toBe("2H");
    expect(getEventPeriod({ minute: 100 })).toBe("ET1");
    expect(getEventPeriod({ minute: 110 })).toBe("ET2");
    expect(getEventPeriod({})).toBe("unknown");
    expect(getEventPeriod({ minute: 20 }, "futsal")).toBe("1H");
    expect(getEventPeriod({ minute: 21 }, "futsal")).toBe("2H");
    expect(getEventPeriod({ minute: 43 }, "futsal")).toBe("ET1");
  });
});
