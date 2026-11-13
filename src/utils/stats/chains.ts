import { ChainTerminationReason, PassChain } from "../../types/PassChain";
import {
  getZoneFromCoordinates,
  getZonesFromPassChain,
  PitchZone,
} from "../pitchZones";
import { ratio } from "./format";
import { VERTICAL_ZONES } from "./touches";

type Vertical = PitchZone["vertical"];

export const SHOT_TERMINATIONS: readonly ChainTerminationReason[] = [
  "goal",
  "shot_saved",
  "shot_missed",
  "shot_blocked",
];

export type TerminationRow = {
  reason: ChainTerminationReason;
  count: number;
  /** Share of all chains, between 0 and 1. */
  share: number;
};

/** Chains from a start third (rows) to an end third (columns). */
export type ZoneToZone = Record<Vertical, Record<Vertical, number>>;

export type ChainStats = {
  count: number;
  /** Average number of actions per chain; null without chains. */
  averageLength: number | null;
  /** Most common first. */
  terminations: TerminationRow[];
  reachedAttackingThird: number;
  reachedAttackingThirdRate: number | null;
  endedInShot: number;
  endedInShotRate: number | null;
  zoneToZone: ZoneToZone;
};

/** Actions that were really played (not placeholders). */
const playedActions = (chain: PassChain) =>
  chain.actions.filter((a) => a.actionType !== "placeholder");

/** Everything the pass chains stats view shows. */
export const getChainStats = (chains: PassChain[]): ChainStats => {
  const count = chains.length;
  const totalActions = chains.reduce(
    (sum, chain) => sum + playedActions(chain).length,
    0,
  );

  const reasonCounts = new Map<ChainTerminationReason, number>();
  for (const chain of chains) {
    reasonCounts.set(
      chain.terminationReason,
      (reasonCounts.get(chain.terminationReason) ?? 0) + 1,
    );
  }
  const terminations = [...reasonCounts.entries()]
    .map(([reason, n]) => ({ reason, count: n, share: n / count }))
    .sort((a, b) => b.count - a.count);

  const reachedAttackingThird = chains.filter((chain) =>
    playedActions(chain).some(
      (a) => getZoneFromCoordinates(a).vertical === "attacking",
    ),
  ).length;
  const endedInShot = chains.filter((chain) =>
    SHOT_TERMINATIONS.includes(chain.terminationReason),
  ).length;

  const zoneToZone = Object.fromEntries(
    VERTICAL_ZONES.map((from) => [
      from,
      Object.fromEntries(VERTICAL_ZONES.map((to) => [to, 0])),
    ]),
  ) as ZoneToZone;
  for (const chain of chains) {
    const zones = chain.zones ?? getZonesFromPassChain(chain.actions);
    if (zones) zoneToZone[zones.start.vertical][zones.end.vertical] += 1;
  }

  return {
    count,
    averageLength: ratio(totalActions, count),
    terminations,
    reachedAttackingThird,
    reachedAttackingThirdRate: ratio(reachedAttackingThird, count),
    endedInShot,
    endedInShotRate: ratio(endedInShot, count),
    zoneToZone,
  };
};

/** "Shot saved" for "shot_saved". */
export const formatTerminationReason = (reason: ChainTerminationReason) => {
  const text = reason.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
