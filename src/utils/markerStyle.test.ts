import { describe, expect, it } from "vitest";
import {
  ACTION_CATEGORY_MARKER_COLORS,
  TEAM_MARKER_COLORS,
} from "../constants/markerColors";
import { Shot } from "../types/Shot";
import {
  ACTION_MARKER_SIZE,
  getActionMarkerStyle,
  getShotMarkerShape,
  getShotMarkerStyle,
  markerBoxSize,
  PENALTY_MARKER_SIZE,
  SHOT_MARKER_MAX_SIZE,
  SHOT_MARKER_MIN_SIZE,
  shotMarkerSize,
} from "./markerStyle";

const shot = (overrides: Partial<Shot> = {}): Shot => ({
  id: "1",
  x: 50,
  y: 12,
  isGoal: false,
  result: "Saved",
  bodyPart: "Foot",
  shotType: "Open Play",
  team: "home",
  timestamp: 0,
  ...overrides,
});

describe("getShotMarkerShape", () => {
  it("gives every result its own shape", () => {
    expect(getShotMarkerShape("Goal")).toBe("star");
    expect(getShotMarkerShape("Saved")).toBe("circle");
    expect(getShotMarkerShape("Blocked")).toBe("triangle");
    expect(getShotMarkerShape("Miss")).toBe("ring");
  });
});

describe("shotMarkerSize", () => {
  it("runs from the minimum at xG 0 to the maximum at xG 0.5", () => {
    expect(shotMarkerSize(0)).toBe(SHOT_MARKER_MIN_SIZE);
    expect(shotMarkerSize(0.25)).toBe(19);
    expect(shotMarkerSize(0.5)).toBe(SHOT_MARKER_MAX_SIZE);
  });

  it("clamps out-of-range xG", () => {
    expect(shotMarkerSize(0.9)).toBe(SHOT_MARKER_MAX_SIZE);
    expect(shotMarkerSize(-1)).toBe(SHOT_MARKER_MIN_SIZE);
  });

  it("caps penalties", () => {
    expect(shotMarkerSize(0.76, "Penalty")).toBe(PENALTY_MARKER_SIZE);
    expect(PENALTY_MARKER_SIZE).toBeLessThan(SHOT_MARKER_MAX_SIZE);
  });

  it("always fits in the 44px hit area, even as a star", () => {
    expect(markerBoxSize("star", SHOT_MARKER_MAX_SIZE)).toBeLessThan(44);
  });
});

describe("getShotMarkerStyle", () => {
  it("colours by team and shapes by result", () => {
    expect(getShotMarkerStyle(shot({ team: "home" })).color).toBe(
      TEAM_MARKER_COLORS.home,
    );
    const away = getShotMarkerStyle(shot({ team: "away", result: "Blocked" }));
    expect(away.color).toBe(TEAM_MARKER_COLORS.away);
    expect(away.shape).toBe("triangle");
  });

  it("falls back to isGoal for shots without a result", () => {
    const legacy = shot({ result: undefined, isGoal: true });
    expect(getShotMarkerStyle(legacy).shape).toBe("star");
  });

  it("draws closer shots bigger", () => {
    const far = getShotMarkerStyle(shot({ y: 30 })).size;
    const near = getShotMarkerStyle(shot({ y: 5 })).size;
    expect(near).toBeGreaterThan(far);
  });
});

describe("getActionMarkerStyle", () => {
  it("is filled when successful and hollow when not", () => {
    expect(
      getActionMarkerStyle({ category: "attacking", outcome: "successful" })
        .shape,
    ).toBe("circle");
    expect(
      getActionMarkerStyle({ category: "attacking", outcome: "unsuccessful" })
        .shape,
    ).toBe("ring");
    expect(
      getActionMarkerStyle({ category: "defensive", outcome: "lost" }).shape,
    ).toBe("ring");
  });

  it("colours by category at a fixed size", () => {
    const style = getActionMarkerStyle({ category: "duel", outcome: "won" });
    expect(style.color).toBe(ACTION_CATEGORY_MARKER_COLORS.duel);
    expect(style.size).toBe(ACTION_MARKER_SIZE);
  });
});
