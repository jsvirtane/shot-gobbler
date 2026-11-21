import { describe, expect, it } from "vitest";
import { actionTypeInfo, actionTypeName } from "../../constants/actionTypes";
import { touchSections } from "./touchRings";

const labelOf = (pitch?: "football" | "futsal") =>
  touchSections({ ring: "more" }, undefined, pitch)
    .flatMap((section) => section.items)
    .find((item) => item.id === "throw-in")?.ariaLabel;

describe("throw-in label", () => {
  it("is a kick-in in futsal", () => {
    expect(labelOf()).toBe("Throw-in");
    expect(labelOf("futsal")).toBe("Kick-in");
    expect(actionTypeInfo("throw-in", "futsal").label).toBe("Kick-in");
    expect(actionTypeName("throw-in", "futsal")).toBe("Kick-in");
    expect(actionTypeName("throw-in")).toBe("Throw-in");
    expect(actionTypeName("pass", "futsal")).toBe("pass");
  });
});
