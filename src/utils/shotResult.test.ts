import { describe, expect, it } from "vitest";
import { SHOT_RESULT_FILLS, shotResultTextColors } from "./shotResult";

describe("shot result colours", () => {
  it("are the same family in the ring and in the lists", () => {
    // Saved is cyan everywhere, never the away team's orange
    expect(SHOT_RESULT_FILLS.Saved).toBe("#0891b2");
    expect(shotResultTextColors.Saved).toBe("text-cyan-600");
    expect(shotResultTextColors.Goal).toBe("text-green-600");
    expect(shotResultTextColors.Miss).toBe("text-red-600");
    expect(Object.values(shotResultTextColors).join(" ")).not.toMatch(/orange/);
  });
});
