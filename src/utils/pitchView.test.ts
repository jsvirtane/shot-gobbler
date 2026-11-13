import { describe, expect, it } from "vitest";
import { mirrorToTopHalf } from "./pitchView";

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
