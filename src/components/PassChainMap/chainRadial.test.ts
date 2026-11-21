import { describe, expect, it } from "vitest";
import { endSections } from "./chainRadial";

const reasons = (pitch?: "football" | "futsal") =>
  endSections(pitch).flatMap((section) => section.items.map((i) => i.id));

describe("endSections", () => {
  it("offers offside in football but not in futsal", () => {
    expect(reasons()).toContain("offside");
    expect(reasons("futsal")).not.toContain("offside");
    expect(reasons("futsal")).toContain("fouled");
  });
});
