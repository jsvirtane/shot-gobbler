import { describe, expect, it } from "vitest";
import { createEnvelope } from "./dataSchema";
import { validateImport } from "./importValidation";

const validShot = {
  id: "s1",
  x: 50,
  y: 20,
  isGoal: false,
  result: "Saved",
  bodyPart: "Foot",
  shotType: "Open Play",
  team: "home",
  timestamp: 1700000000000,
};

const validAction = {
  id: "a1",
  x: 30,
  y: 40,
  category: "attacking",
  actionType: "pass",
  outcome: "successful",
  timestamp: 1700000000000,
};

const validChain = {
  id: "c1",
  actions: [
    { x: 50, y: 80, sequenceNumber: 0, actionType: "start" },
    { x: 50, y: 20, sequenceNumber: 1, actionType: "shot" },
  ],
  terminationReason: "goal",
  isCompleted: true,
  zones: null,
};

describe("validateImport", () => {
  it("rejects data that is not a non-empty array", () => {
    expect(validateImport({}, "shots").ok).toBe(false);
    expect(validateImport([], "shots").ok).toBe(false);
    expect(validateImport("text", "touches").ok).toBe(false);
  });

  it("accepts valid shots and gives them new ids", () => {
    const result = validateImport([validShot], "shots");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].result).toBe("Saved");
    expect(result.items[0].id).not.toBe("s1");
    expect(result.skipped).toBe(0);
  });

  it("accepts old shots without a result field", () => {
    const oldGoal: Record<string, unknown> = { ...validShot, isGoal: true };
    delete oldGoal.result;
    const result = validateImport([oldGoal], "shots");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items[0].result).toBe("Goal");
    expect(result.items[0].isGoal).toBe(true);
  });

  it("keeps isGoal consistent with result", () => {
    const result = validateImport(
      [{ ...validShot, result: "Goal", isGoal: false }],
      "shots",
    );
    expect(result.ok && result.items[0].isGoal).toBe(true);
  });

  it("skips invalid items and reports how many", () => {
    const result = validateImport(
      [validShot, { ...validShot, x: "far" }, { ...validShot, team: "x" }],
      "shots",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.skipped).toBe(2);
  });

  it("tells the user which tab to use for a file of another type", () => {
    const result = validateImport([validAction], "shots");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("contains touches");
    expect(result.error).toContain("Touches tab");

    const chainResult = validateImport([validShot], "pass-chains");
    expect(!chainResult.ok && chainResult.error).toContain("Shots tab");
  });

  it("rejects files that match no data type", () => {
    const result = validateImport([{ foo: 1 }], "touches");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("valid touches");
  });

  it("rejects actions whose type doesn't belong to their category", () => {
    const result = validateImport(
      [{ ...validAction, category: "duel", actionType: "pass" }],
      "touches",
    );
    expect(result.ok).toBe(false);
  });

  it("accepts pass chains and recalculates zones", () => {
    const result = validateImport([validChain], "pass-chains");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const chain = result.items[0];
    expect(chain.id).toMatch(/^chain-/);
    expect(chain.actions[0].pitchZone).toEqual({
      horizontal: "central",
      vertical: "defensive",
    });
    expect(chain.zones?.end).toEqual({
      horizontal: "central",
      vertical: "attacking",
    });
  });

  it("rejects pass chains with an invalid action", () => {
    const result = validateImport(
      [{ ...validChain, actions: [{ x: 10, y: 10, actionType: "teleport" }] }],
      "pass-chains",
    );
    expect(result.ok).toBe(false);
  });

  describe("envelopes", () => {
    it("accepts an envelope of the matching type", () => {
      const result = validateImport(
        createEnvelope("shots", [validShot]),
        "shots",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.items).toHaveLength(1);
    });

    it("accepts an old v0 envelope", () => {
      const result = validateImport(
        {
          app: "shot-gobbler",
          type: "touches",
          version: 0,
          data: [validAction],
        },
        "touches",
      );
      expect(result.ok).toBe(true);
    });

    it("tells the user which tab to use for an envelope of another type", () => {
      const result = validateImport(
        createEnvelope("touches", [validAction]),
        "shots",
      );
      expect(result).toEqual({
        ok: false,
        error:
          "This file contains touches, not shots. Switch to the Touches tab to import it.",
      });
    });

    it("rejects an empty envelope or one from another app", () => {
      expect(validateImport(createEnvelope("shots", []), "shots").ok).toBe(
        false,
      );
      expect(
        validateImport(
          { app: "other", type: "shots", version: 1, data: [validShot] },
          "shots",
        ).ok,
      ).toBe(false);
    });
  });
});
