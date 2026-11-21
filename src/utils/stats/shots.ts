import { Team } from "../../types/common";
import { Period, PERIODS } from "../../types/Match";
import { DEFAULT_PITCH_TYPE, PitchType } from "../../types/Pitch";
import { BodyPart, Shot, ShotType } from "../../types/Shot";
import { periodEndMinute } from "../matchClock";
import { hasSpotKick } from "../shotDraft";
import { getShotResult } from "../shotResult";
import { TEAMS } from "../teamLabels";
import { shotXg } from "../xg";
import { ratio } from "./format";

export type ShotTotals = {
  shots: number;
  /** Goals and saved shots. */
  onTarget: number;
  goals: number;
  saved: number;
  blocked: number;
  /** Misses. */
  offTarget: number;
  xg: number;
};

export type TeamShotStats = ShotTotals & {
  team: Team;
  /** Ratios between 0 and 1; null when there are no shots. */
  onTargetRate: number | null;
  conversionRate: number | null;
  xgPerShot: number | null;
  /** Goals minus xG; null when there are no shots. */
  goalsMinusXg: number | null;
};

/** One row of a breakdown table, with totals per team. */
export type ShotBreakdownRow<K extends string> = {
  key: K;
  byTeam: Record<Team, ShotTotals>;
};

export type PeriodKey = Period | "unknown";

export type ShotStats = {
  teams: Record<Team, TeamShotStats>;
  byBodyPart: ShotBreakdownRow<BodyPart>[];
  byShotType: ShotBreakdownRow<ShotType>[];
  /** Periods that had shots; empty when no shot has a minute or period. */
  byPeriod: ShotBreakdownRow<PeriodKey>[];
};

export const BODY_PARTS: readonly BodyPart[] = ["Foot", "Head", "Other"];
export const SHOT_TYPES: readonly ShotType[] = [
  "Open Play",
  "Set Piece",
  "Penalty",
  "10m Kick",
];

const emptyTotals = (): ShotTotals => ({
  shots: 0,
  onTarget: 0,
  goals: 0,
  saved: 0,
  blocked: 0,
  offTarget: 0,
  xg: 0,
});

/** Counts and xG of the shots. */
export const getShotTotals = (
  shots: Shot[],
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): ShotTotals => {
  const totals = emptyTotals();
  for (const shot of shots) {
    const result = getShotResult(shot);
    totals.shots += 1;
    totals.xg += shotXg(shot, pitch);
    if (result === "Goal") totals.goals += 1;
    else if (result === "Saved") totals.saved += 1;
    else if (result === "Blocked") totals.blocked += 1;
    else totals.offTarget += 1;
  }
  totals.onTarget = totals.goals + totals.saved;
  return totals;
};

/** Totals and rates for one team's shots. */
export const getTeamShotStats = (
  shots: Shot[],
  team: Team,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): TeamShotStats => {
  const totals = getShotTotals(
    shots.filter((shot) => shot.team === team),
    pitch,
  );
  return {
    ...totals,
    team,
    onTargetRate: ratio(totals.onTarget, totals.shots),
    conversionRate: ratio(totals.goals, totals.shots),
    xgPerShot: ratio(totals.xg, totals.shots),
    goalsMinusXg: totals.shots > 0 ? totals.goals - totals.xg : null,
  };
};

const breakdown = <K extends string>(
  shots: Shot[],
  keys: readonly K[],
  keyOf: (shot: Shot) => K,
  pitch: PitchType,
): ShotBreakdownRow<K>[] =>
  keys.map((key) => {
    const matching = shots.filter((shot) => keyOf(shot) === key);
    const byTeam = Object.fromEntries(
      TEAMS.map((team) => [
        team,
        getShotTotals(
          matching.filter((shot) => shot.team === team),
          pitch,
        ),
      ]),
    ) as Record<Team, ShotTotals>;
    return { key, byTeam };
  });

/** The period of an event; from its minute when the period is missing. */
export const getEventPeriod = (
  event: {
    minute?: number;
    period?: Period;
  },
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): PeriodKey => {
  if (event.period) return event.period;
  if (event.minute === undefined) return "unknown";
  if (event.minute <= periodEndMinute("1H", pitch)) return "1H";
  if (event.minute <= periodEndMinute("2H", pitch)) return "2H";
  if (event.minute <= periodEndMinute("ET1", pitch)) return "ET1";
  return "ET2";
};

const PERIOD_KEYS: readonly PeriodKey[] = [...PERIODS, "unknown"];

/** Everything the shots stats view shows. */
export const getShotStats = (
  shots: Shot[],
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): ShotStats => {
  const timed = shots.some(
    (shot) => shot.minute !== undefined || shot.period !== undefined,
  );
  return {
    teams: {
      home: getTeamShotStats(shots, "home", pitch),
      away: getTeamShotStats(shots, "away", pitch),
    },
    byBodyPart: breakdown(shots, BODY_PARTS, (shot) => shot.bodyPart, pitch),
    // The 10 m kick row only where the pitch has one, or a shot uses it
    byShotType: breakdown(
      shots,
      SHOT_TYPES.filter(
        (type) =>
          type !== "10m Kick" ||
          hasSpotKick(type, pitch) ||
          shots.some((shot) => shot.shotType === type),
      ),
      (shot) => shot.shotType,
      pitch,
    ),
    byPeriod: timed
      ? breakdown(
          shots,
          PERIOD_KEYS,
          (shot) => getEventPeriod(shot, pitch),
          pitch,
        ).filter((row) => TEAMS.some((team) => row.byTeam[team].shots > 0))
      : [],
  };
};
