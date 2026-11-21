import { EventMeta } from "../types/common";
import { MatchClock, Period, PERIODS } from "../types/Match";
import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";
import { pitchSpec } from "./pitchSpecs";

const MINUTE_MS = 60_000;

/**
 * Minutes played before the period starts: the regular lengths of the
 * periods before it (football: 0, 45, 90, 105, 120; futsal: 0, 20, 40, 45,
 * 50).
 */
export const periodBaseMinute = (
  period: Period,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number => {
  const lengths = pitchSpec(pitch).periodMinutes;
  return PERIODS.slice(0, PERIODS.indexOf(period)).reduce(
    (sum, p) => sum + lengths[p],
    0,
  );
};

/** Regular end of the period; later minutes are added time. */
export const periodEndMinute = (
  period: Period,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number =>
  periodBaseMinute(period, pitch) + pitchSpec(pitch).periodMinutes[period];

export const PERIOD_LABELS: Record<Period, string> = {
  "1H": "1st half",
  "2H": "2nd half",
  ET1: "Extra time 1",
  ET2: "Extra time 2",
  PEN: "Penalties",
};

export const NEW_CLOCK: MatchClock = {
  period: "1H",
  running: false,
  startedAt: null,
  elapsedBeforeStartMs: 0,
};

export const isPeriod = (value: unknown): value is Period =>
  typeof value === "string" && PERIODS.includes(value as Period);

/** Time played in the current period at `now`. */
export const elapsedMs = (clock: MatchClock, now: number): number =>
  clock.elapsedBeforeStartMs +
  (clock.running && clock.startedAt !== null
    ? Math.max(0, now - clock.startedAt)
    : 0);

/**
 * The match minute at `now`, counted like a broadcast clock: the first
 * minute of the match is 1, the first of the second half 46. A paused
 * clock keeps its last minute. The shoot-out has no running time.
 */
export const clockMinute = (
  clock: MatchClock,
  now: number,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): number =>
  clock.period === "PEN"
    ? periodBaseMinute("PEN", pitch)
    : periodBaseMinute(clock.period, pitch) +
      Math.floor(elapsedMs(clock, now) / MINUTE_MS) +
      1;

export const startClock = (clock: MatchClock, now: number): MatchClock =>
  clock.running || clock.period === "PEN"
    ? clock
    : { ...clock, running: true, startedAt: now };

export const pauseClock = (clock: MatchClock, now: number): MatchClock =>
  clock.running
    ? {
        ...clock,
        running: false,
        startedAt: null,
        elapsedBeforeStartMs: elapsedMs(clock, now),
      }
    : clock;

export const nextPeriodOf = (period: Period): Period | null => {
  const index = PERIODS.indexOf(period);
  return index < PERIODS.length - 1 ? PERIODS[index + 1] : null;
};

/** Moves to the next period, paused at its start. */
export const nextPeriod = (clock: MatchClock): MatchClock => {
  const period = nextPeriodOf(clock.period);
  return period
    ? { period, running: false, startedAt: null, elapsedBeforeStartMs: 0 }
    : clock;
};

/** Moves the clock by whole minutes (never before the period start). */
export const adjustClock = (
  clock: MatchClock,
  minutes: number,
  now: number,
): MatchClock => {
  const elapsed = Math.max(0, elapsedMs(clock, now) + minutes * MINUTE_MS);
  return clock.running
    ? { ...clock, startedAt: now, elapsedBeforeStartMs: elapsed }
    : { ...clock, elapsedBeforeStartMs: elapsed };
};

/** Minute and period for a new event; nothing until the clock is used. */
export const clockStamp = (
  clock: MatchClock | undefined,
  now: number,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): Pick<EventMeta, "minute" | "period"> =>
  clock ? { minute: clockMinute(clock, now, pitch), period: clock.period } : {};

/** "23'", or "45+2'" for added time when the period is known. */
export const formatMinute = (
  minute: number,
  period?: Period,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): string => {
  if (period === "PEN") return "PEN";
  if (period) {
    const end = periodEndMinute(period, pitch);
    if (minute > end) return `${end}+${minute - end}'`;
  }
  return `${minute}'`;
};

/** E.g. "23' 1H"; null for events recorded without a minute. */
export const formatEventTime = (
  event: EventMeta,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): string | null => {
  if (event.minute === undefined) {
    return event.period === "PEN" ? "PEN" : null;
  }
  const minute = formatMinute(event.minute, event.period, pitch);
  return event.period && event.period !== "PEN"
    ? `${minute} ${event.period}`
    : minute;
};

/** Reads a stored clock; null when it is unusable. */
export const normalizeClock = (value: unknown): MatchClock | null => {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!isPeriod(record.period)) return null;
  const before =
    typeof record.elapsedBeforeStartMs === "number" &&
    Number.isFinite(record.elapsedBeforeStartMs)
      ? Math.max(0, record.elapsedBeforeStartMs)
      : 0;
  const startedAt =
    typeof record.startedAt === "number" && Number.isFinite(record.startedAt)
      ? record.startedAt
      : null;
  const running = record.running === true && startedAt !== null;
  return {
    period: record.period,
    running,
    startedAt: running ? startedAt : null,
    elapsedBeforeStartMs: before,
  };
};

/** Minute and period from imported data, when valid. */
export const normalizeEventTime = (
  item: Record<string, unknown>,
): Pick<EventMeta, "minute" | "period"> => ({
  ...(typeof item.minute === "number" &&
  Number.isInteger(item.minute) &&
  item.minute >= 0 &&
  item.minute <= 200
    ? { minute: item.minute }
    : {}),
  ...(isPeriod(item.period) ? { period: item.period } : {}),
});

/** E.g. "23' 1H"; "–' 1H" before the clock is first used. */
export const formatClock = (
  clock: MatchClock | undefined,
  now: number,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
) => {
  if (!clock) return "–' 1H";
  if (clock.period === "PEN") return "PEN";
  return `${formatMinute(clockMinute(clock, now, pitch), clock.period, pitch)} ${clock.period}`;
};

/** Starts a paused clock or pauses a running one. */
export const toggleClock = (clock: MatchClock, now: number): MatchClock =>
  clock.running ? pauseClock(clock, now) : startClock(clock, now);

/** `{ minute }` for a valid typed minute, otherwise nothing. */
export const parseMinuteInput = (value: string): { minute?: number } => {
  const minute = Number(value);
  return value.trim() !== "" &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 200
    ? { minute }
    : {};
};
