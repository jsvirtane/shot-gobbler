import { describe, expect, it } from "vitest";
import { getChainStats } from "./chains";
import { formatSigned } from "./format";
import { getTeamShotStats } from "./shots";
import {
  abbreviateTeam,
  chainSummary,
  shotSummary,
  touchSummary,
} from "./summary";
import { getTouchStats } from "./touches";
import { Shot } from "../../types/Shot";

const penalty = (result: Shot["result"]): Shot => ({
  id: result,
  x: 50,
  y: 11,
  team: "home",
  result,
  isGoal: result === "Goal",
  bodyPart: "Foot",
  shotType: "Penalty",
  timestamp: 0,
});

describe("shotSummary", () => {
  it("summarises a team's shots in words and abbreviated", () => {
    const stats = getTeamShotStats(
      [penalty("Goal"), penalty("Saved"), penalty("Miss")],
      "home",
    );
    expect(shotSummary(stats)).toEqual({
      full: "3 shots · 2 on target · 1 goal · 2.28 xG",
      compact: "3 sh 2 OT 1 G 2.28 xG",
    });
  });

  it("works without shots", () => {
    expect(shotSummary(getTeamShotStats([], "away")).full).toBe(
      "0 shots · 0 on target · 0 goals · 0.00 xG",
    );
  });
});

describe("touchSummary and chainSummary", () => {
  it("show dashes when nothing can be divided", () => {
    expect(touchSummary(getTouchStats([])).full).toBe(
      "0 actions · – pass completion · – defensive won",
    );
    expect(chainSummary(getChainStats([])).compact).toBe(
      "0 ch · – avg · – F3 · – shot",
    );
  });
});

describe("abbreviateTeam", () => {
  it("shortens long names to three capitals", () => {
    expect(abbreviateTeam("Arsenal")).toBe("ARS");
    expect(abbreviateTeam("Home")).toBe("Home");
  });
});

describe("formatSigned", () => {
  it("adds a sign and handles missing values", () => {
    expect(formatSigned(0.4217)).toBe("+0.42");
    expect(formatSigned(-0.17)).toBe("−0.17");
    expect(formatSigned(0.001)).toBe("0.00");
    expect(formatSigned(null)).toBe("–");
  });
});
