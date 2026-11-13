import { formatXg } from "../xg";
import { ChainStats } from "./chains";
import { formatDecimal, formatPercent, plural } from "./format";
import { TeamShotStats } from "./shots";
import { TouchStats } from "./touches";

/** The same summary in words and abbreviated for narrow screens. */
export type SummaryText = { full: string; compact: string };

/** e.g. "8 shots · 3 on target · 1 goal · 1.23 xG". */
export const shotSummary = (stats: TeamShotStats): SummaryText => ({
  full: [
    plural(stats.shots, "shot"),
    `${stats.onTarget} on target`,
    plural(stats.goals, "goal"),
    `${formatXg(stats.xg)} xG`,
  ].join(" · "),
  compact: [
    `${stats.shots} sh`,
    `${stats.onTarget} OT`,
    `${stats.goals} G`,
    `${formatXg(stats.xg)} xG`,
    // Spaces only: two teams have to fit side by side on a phone
  ].join(" "),
});

/** A short team name for narrow screens, e.g. "ARS" for "Arsenal". */
export const abbreviateTeam = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.length <= 4 ? trimmed : trimmed.slice(0, 3).toUpperCase();
};

/** e.g. "20 actions · 78% pass completion · 60% defensive won". */
export const touchSummary = (stats: TouchStats): SummaryText => ({
  full: [
    plural(stats.total, "action"),
    `${formatPercent(stats.passCompletion.rate)} pass completion`,
    `${formatPercent(stats.defensiveWon.rate)} defensive won`,
  ].join(" · "),
  compact: [
    `${stats.total} act`,
    `${formatPercent(stats.passCompletion.rate)} pass`,
    `${formatPercent(stats.defensiveWon.rate)} def won`,
  ].join(" · "),
});

/** e.g. "5 chains · 4.2 actions avg · 40% final third · 20% shot". */
export const chainSummary = (stats: ChainStats): SummaryText => ({
  full: [
    plural(stats.count, "chain"),
    `${formatDecimal(stats.averageLength, 1)} actions avg`,
    `${formatPercent(stats.reachedAttackingThirdRate)} final third`,
    `${formatPercent(stats.endedInShotRate)} end in shot`,
  ].join(" · "),
  compact: [
    `${stats.count} ch`,
    `${formatDecimal(stats.averageLength, 1)} avg`,
    `${formatPercent(stats.reachedAttackingThirdRate)} F3`,
    `${formatPercent(stats.endedInShotRate)} shot`,
  ].join(" · "),
});
