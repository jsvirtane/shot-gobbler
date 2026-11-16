import { describe, expect, it } from "vitest";
import {
  displayToStored,
  fromVisibleShare,
  mirrorToBottomHalf,
  storedToDisplay,
  teamForPoint,
  toAttackingHalf,
  toVisibleShare,
} from "./pitchView";

describe("teamForPoint", () => {
  it("is home in the top half and away in the bottom half", () => {
    expect(teamForPoint({ x: 50, y: 10 })).toBe("home");
    expect(teamForPoint({ x: 50, y: 90 })).toBe("away");
  });
});

describe("toAttackingHalf", () => {
  it("keeps a point already in the team's attacking half", () => {
    const point = { x: 30, y: 20 };
    expect(toAttackingHalf(point, "home")).toBe(point);
    expect(toAttackingHalf({ x: 30, y: 80 }, "away")).toEqual({ x: 30, y: 80 });
  });

  it("rotates a point in the other half", () => {
    expect(toAttackingHalf({ x: 30, y: 80 }, "home")).toEqual({ x: 70, y: 20 });
    expect(toAttackingHalf({ x: 30, y: 20 }, "away")).toEqual({ x: 70, y: 80 });
  });
});

describe("mirrorToBottomHalf", () => {
  it("leaves points in the bottom half unchanged", () => {
    const point = { x: 30, y: 90 };
    expect(mirrorToBottomHalf(point)).toBe(point);
  });

  it("leaves points on the halfway line unchanged", () => {
    expect(mirrorToBottomHalf({ x: 20, y: 50 })).toEqual({ x: 20, y: 50 });
  });

  it("rotates top-half points 180 degrees into the bottom half", () => {
    expect(mirrorToBottomHalf({ x: 30, y: 10 })).toEqual({ x: 70, y: 90 });
    expect(mirrorToBottomHalf({ x: 50, y: 0 })).toEqual({ x: 50, y: 100 });
  });

  it("keeps other fields", () => {
    expect(mirrorToBottomHalf({ id: "a", x: 0, y: 25 })).toEqual({
      id: "a",
      x: 100,
      y: 75,
    });
  });
});

describe("half view display mapping", () => {
  it("shows the bottom half, so the goal is at the bottom of the screen", () => {
    // Bottom goal line at the bottom edge, halfway line at the top edge
    expect(toVisibleShare({ x: 50, y: 100 }, "half")).toEqual({ x: 0.5, y: 1 });
    expect(toVisibleShare({ x: 0, y: 50 }, "half")).toEqual({ x: 0, y: 0 });
    expect(fromVisibleShare({ x: 0.25, y: 0.5 }, "half")).toEqual({
      x: 25,
      y: 75,
    });
  });

  it("maps the full pitch one to one", () => {
    expect(toVisibleShare({ x: 20, y: 40 }, "full")).toEqual({
      x: 0.2,
      y: 0.4,
    });
    expect(fromVisibleShare({ x: 0.2, y: 0.4 }, "full")).toEqual({
      x: 20,
      y: 40,
    });
  });

  it("shows shots at both goals attacking the bottom goal", () => {
    // A home shot near the top goal and an away shot near the bottom one
    expect(storedToDisplay({ x: 30, y: 10 }, "half")).toEqual({ x: 70, y: 90 });
    expect(storedToDisplay({ x: 30, y: 90 }, "half")).toEqual({ x: 30, y: 90 });
    expect(storedToDisplay({ x: 30, y: 10 }, "full")).toEqual({ x: 30, y: 10 });
  });

  it("a tap in the half view lands where the finger is for either team", () => {
    const tap = fromVisibleShare({ x: 0.3, y: 0.8 }, "half");
    for (const team of ["home", "away"] as const) {
      const stored = toAttackingHalf(tap, team);
      expect(teamForPoint(stored)).toBe(team);
      expect(storedToDisplay(stored, "half")).toEqual(tap);
    }
  });
});

describe("displayToStored", () => {
  it("stores the dropped point as is in the full view", () => {
    expect(displayToStored({ x: 10, y: 80 }, { x: 40, y: 30 }, "full")).toEqual(
      { x: 40, y: 30 },
    );
  });

  it("keeps bottom-half items unmirrored in the half view", () => {
    expect(displayToStored({ x: 10, y: 80 }, { x: 40, y: 70 }, "half")).toEqual(
      { x: 40, y: 70 },
    );
  });

  it("mirrors a top-half item back so it shows where it was dropped", () => {
    const stored = displayToStored({ x: 10, y: 20 }, { x: 40, y: 70 }, "half");
    expect(stored).toEqual({ x: 60, y: 30 });
    expect(mirrorToBottomHalf(stored)).toEqual({ x: 40, y: 70 });
  });

  it("does not mirror a drop on the halfway line", () => {
    const stored = displayToStored({ x: 10, y: 20 }, { x: 40, y: 50 }, "half");
    expect(mirrorToBottomHalf(stored)).toEqual({ x: 40, y: 50 });
  });
});
