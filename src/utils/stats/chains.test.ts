import { describe, expect, it } from "vitest";
import {
  ChainAction,
  ChainTerminationReason,
  PassChain,
} from "../../types/PassChain";
import { getZoneFromCoordinates, getZonesFromPassChain } from "../pitchZones";
import { formatTerminationReason, getChainStats } from "./chains";

let id = 0;
const chain = (
  points: [number, number][],
  terminationReason: ChainTerminationReason,
  storeZones = true,
): PassChain => {
  const actions: ChainAction[] = points.map(([x, y], i) => ({
    x,
    y,
    sequenceNumber: i,
    actionType: i === 0 ? "start" : "pass",
    pitchZone: getZoneFromCoordinates({ x, y }),
  }));
  return {
    id: String(id++),
    actions,
    terminationReason,
    isCompleted: true,
    zones: storeZones ? getZonesFromPassChain(actions) : null,
  };
};

describe("getChainStats", () => {
  it("handles no chains", () => {
    const stats = getChainStats([]);
    expect(stats.count).toBe(0);
    expect(stats.averageLength).toBeNull();
    expect(stats.terminations).toEqual([]);
    expect(stats.reachedAttackingThirdRate).toBeNull();
    expect(stats.endedInShotRate).toBeNull();
    expect(stats.zoneToZone.defensive.attacking).toBe(0);
  });

  it("computes length, endings and attacking third rates", () => {
    const stats = getChainStats([
      // Defensive → attacking, ends in a goal
      chain(
        [
          [50, 90],
          [50, 50],
          [50, 20],
        ],
        "goal",
      ),
      // Stays in midfield
      chain(
        [
          [50, 50],
          [40, 60],
        ],
        "intercepted",
      ),
      // Reaches the attacking third, then comes back
      chain(
        [
          [50, 60],
          [50, 25],
          [50, 40],
          [50, 35],
          [60, 45],
        ],
        "shot_blocked",
      ),
      chain(
        [
          [50, 80],
          [50, 75],
        ],
        "intercepted",
        false,
      ),
    ]);
    expect(stats.count).toBe(4);
    expect(stats.averageLength).toBe(3);
    expect(stats.terminations).toEqual([
      { reason: "intercepted", count: 2, share: 0.5 },
      { reason: "goal", count: 1, share: 0.25 },
      { reason: "shot_blocked", count: 1, share: 0.25 },
    ]);
    expect(stats.reachedAttackingThird).toBe(2);
    expect(stats.reachedAttackingThirdRate).toBe(0.5);
    expect(stats.endedInShot).toBe(2);
    expect(stats.endedInShotRate).toBe(0.5);
    expect(stats.zoneToZone.defensive.attacking).toBe(1);
    expect(stats.zoneToZone.midfield.midfield).toBe(2);
    // Zones are worked out from the actions when not stored
    expect(stats.zoneToZone.defensive.defensive).toBe(1);
  });

  it("does not count placeholder actions in the length", () => {
    const c = chain(
      [
        [50, 50],
        [50, 40],
      ],
      "manual_end",
    );
    c.actions.push({ ...c.actions[1], actionType: "placeholder" });
    expect(getChainStats([c]).averageLength).toBe(2);
  });
});

describe("formatTerminationReason", () => {
  it("turns ids into words", () => {
    expect(formatTerminationReason("shot_saved")).toBe("Shot saved");
    expect(formatTerminationReason("goal")).toBe("Goal");
  });
});
