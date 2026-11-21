import { describe, expect, it } from "vitest";
import { BodyPart, ShotType } from "../types/Shot";
import { fromMetres } from "./pitchGeometry";
import { formatXg, PENALTY_XG, shotXg, totalXg } from "./xg";

// A shot at the top goal, position in metres from the top-left corner
const shotAt = (
  x: number,
  y: number,
  bodyPart: BodyPart = "Foot",
  shotType: ShotType = "Open Play",
) => ({ ...fromMetres({ x, y }), bodyPart, shotType });

describe("shotXg", () => {
  it("gives penalties a fixed value", () => {
    expect(shotXg(shotAt(34, 11, "Foot", "Penalty"))).toBe(PENALTY_XG);
    expect(PENALTY_XG).toBe(0.76);
  });

  it("rates a central six-yard box foot shot highly", () => {
    const xg = shotXg(shotAt(34, 5.5));
    expect(xg).toBeGreaterThan(0.3);
    expect(xg).toBeLessThan(0.5);
  });

  it("rates an open play foot shot from the penalty spot", () => {
    const xg = shotXg(shotAt(34, 11));
    expect(xg).toBeGreaterThan(0.15);
    expect(xg).toBeLessThan(0.3);
  });

  it("rates a central shot from 25 m low", () => {
    const xg = shotXg(shotAt(34, 25));
    expect(xg).toBeGreaterThan(0.02);
    expect(xg).toBeLessThan(0.06);
  });

  it("rates a tight angle near the byline low", () => {
    expect(shotXg(shotAt(26, 1))).toBeLessThan(0.1);
    expect(shotXg(shotAt(20, 2))).toBeLessThan(0.06);
  });

  it("rates a header lower than a foot shot from the same spot", () => {
    for (const y of [5.5, 11, 16.5]) {
      expect(shotXg(shotAt(34, y, "Head"))).toBeLessThan(
        shotXg(shotAt(34, y, "Foot")) * 0.6,
      );
    }
  });

  it("decreases with distance", () => {
    let previous = 1;
    for (let y = 2; y <= 40; y += 2) {
      const xg = shotXg(shotAt(34, y));
      expect(xg).toBeLessThan(previous);
      previous = xg;
    }
  });

  it("is the same for the bottom goal", () => {
    const top = shotAt(28, 9);
    const bottom = { ...top, ...fromMetres({ x: 68 - 28, y: 105 - 9 }) };
    expect(shotXg(bottom)).toBeCloseTo(shotXg(top), 10);
  });

  it("stays between 0 and 1", () => {
    for (const [x, y] of [
      [34, 0],
      [0, 0],
      [34, 52],
      [34, -2],
    ]) {
      const xg = shotXg(shotAt(x, y));
      expect(xg).toBeGreaterThanOrEqual(0);
      expect(xg).toBeLessThanOrEqual(1);
    }
  });
});

describe("totalXg and formatXg", () => {
  it("sums and formats with two decimals", () => {
    const shots = [
      shotAt(34, 11, "Foot", "Penalty"),
      shotAt(34, 11, "Foot", "Penalty"),
    ];
    expect(formatXg(totalXg(shots))).toBe("1.52");
    expect(formatXg(totalXg([]))).toBe("0.00");
  });
});

describe("shotXg on a futsal pitch", () => {
  const futsalShot = (
    x: number,
    y: number,
    shotType: ShotType = "Open Play",
  ) => ({
    ...fromMetres({ x, y }, "futsal"),
    bodyPart: "Foot" as BodyPart,
    shotType,
  });

  it("measures to the futsal goal", () => {
    const fromSpot = shotXg(futsalShot(10, 6), "futsal");
    expect(fromSpot).toBeGreaterThan(0.13);
    expect(fromSpot).toBeLessThan(0.2);
    const tenMetres = shotXg(futsalShot(10, 10), "futsal");
    expect(tenMetres).toBeGreaterThan(0.08);
    expect(tenMetres).toBeLessThan(fromSpot);
    // The same stored point is a different shot on a football pitch
    expect(shotXg(futsalShot(10, 6))).not.toBeCloseTo(fromSpot, 2);
  });

  it("gives penalties the fixed value", () => {
    expect(shotXg(futsalShot(10, 6, "Penalty"), "futsal")).toBe(PENALTY_XG);
  });
});
