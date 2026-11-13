import { describe, expect, it } from "vitest";
import { displayToStored, mirrorToTopHalf } from "./pitchView";

describe("mirrorToTopHalf", () => {
  it("leaves points in the top half unchanged", () => {
    const point = { x: 30, y: 10 };
    expect(mirrorToTopHalf(point)).toBe(point);
  });

  it("leaves points on the halfway line unchanged", () => {
    expect(mirrorToTopHalf({ x: 20, y: 50 })).toEqual({ x: 20, y: 50 });
  });

  it("rotates bottom-half points 180 degrees into the top half", () => {
    expect(mirrorToTopHalf({ x: 30, y: 90 })).toEqual({ x: 70, y: 10 });
    expect(mirrorToTopHalf({ x: 50, y: 100 })).toEqual({ x: 50, y: 0 });
  });

  it("keeps other fields", () => {
    expect(mirrorToTopHalf({ id: "a", x: 0, y: 75 })).toEqual({
      id: "a",
      x: 100,
      y: 25,
    });
  });
});

describe("displayToStored", () => {
  it("stores the dropped point as is in the full view", () => {
    expect(displayToStored({ x: 10, y: 80 }, { x: 40, y: 30 }, "full")).toEqual(
      { x: 40, y: 30 },
    );
  });

  it("keeps top-half items unmirrored in the half view", () => {
    expect(
      displayToStored({ x: 10, y: 20 }, { x: 40, y: 30 }, "half-top"),
    ).toEqual({ x: 40, y: 30 });
  });

  it("mirrors a bottom-half item back so it shows where it was dropped", () => {
    const stored = displayToStored(
      { x: 10, y: 80 },
      { x: 40, y: 30 },
      "half-top",
    );
    expect(stored).toEqual({ x: 60, y: 70 });
    expect(mirrorToTopHalf(stored)).toEqual({ x: 40, y: 30 });
  });

  it("does not mirror a drop on the halfway line", () => {
    const stored = displayToStored(
      { x: 10, y: 80 },
      { x: 40, y: 50 },
      "half-top",
    );
    expect(mirrorToTopHalf(stored)).toEqual({ x: 40, y: 50 });
  });
});
