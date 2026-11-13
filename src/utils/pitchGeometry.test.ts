import { describe, expect, it } from "vitest";
import {
  attackedGoal,
  distanceToGoal,
  fromMetres,
  shotAngle,
  toMetres,
} from "./pitchGeometry";

// Points given in metres from the top-left corner of the playing area
const at = (x: number, y: number) => fromMetres({ x, y });

describe("toMetres", () => {
  it("maps the playing area corners onto 68 x 105 m", () => {
    // The box is 111 image units tall and 111 * 74/110 wide; the 74-wide
    // image is centred in it and the lines start 3 units into the image
    const boxWidth = 111 * (74 / 110);
    const imageLeft = (boxWidth - 74) / 2;
    const topLeft = toMetres({
      x: ((imageLeft + 3) / boxWidth) * 100,
      y: (3 / 111) * 100,
    });
    expect(topLeft.x).toBeCloseTo(0, 5);
    expect(topLeft.y).toBeCloseTo(0, 5);

    const bottomRight = toMetres(at(68, 105));
    expect(bottomRight.x).toBeCloseTo(68, 5);
    expect(bottomRight.y).toBeCloseTo(105, 5);
  });

  it("puts the centre spot at the centre of the box", () => {
    const centre = toMetres({ x: 50, y: 50 });
    expect(centre.x).toBeCloseTo(34, 5);
    expect(centre.y).toBeCloseTo(52.5, 5);
  });
});

describe("distanceToGoal and shotAngle", () => {
  it("penalty spot is 11 m out with a wide angle", () => {
    const spot = at(34, 11);
    expect(distanceToGoal(spot, "top")).toBeCloseTo(11, 5);
    expect(shotAngle(spot, "top")).toBeCloseTo(36.8, 1);
  });

  it("edge of the box centrally is 16.5 m out", () => {
    const edge = at(34, 16.5);
    expect(distanceToGoal(edge, "top")).toBeCloseTo(16.5, 5);
    expect(shotAngle(edge, "top")).toBeCloseTo(25, 0);
  });

  it("the angle is 0 on the goal line beside the post", () => {
    expect(shotAngle(at(34 - 3.66 - 1, 0), "top")).toBeCloseTo(0, 5);
    expect(shotAngle(at(34 + 3.66 + 1, 0), "top")).toBeCloseTo(0, 5);
  });

  it("is symmetric for the bottom goal", () => {
    const top = at(25, 12);
    const bottom = at(68 - 25, 105 - 12);
    expect(distanceToGoal(bottom, "bottom")).toBeCloseTo(
      distanceToGoal(top, "top"),
      5,
    );
    expect(shotAngle(bottom, "bottom")).toBeCloseTo(shotAngle(top, "top"), 5);
    expect(distanceToGoal(at(34, 94), "bottom")).toBeCloseTo(11, 5);
    expect(shotAngle(at(34 - 5, 105), "bottom")).toBeCloseTo(0, 5);
  });
});

describe("attackedGoal", () => {
  it("uses the nearest goal", () => {
    expect(attackedGoal({ x: 50, y: 10 })).toBe("top");
    expect(attackedGoal({ x: 50, y: 49.9 })).toBe("top");
    expect(attackedGoal({ x: 50, y: 50 })).toBe("bottom");
    expect(attackedGoal({ x: 50, y: 90 })).toBe("bottom");
  });
});
