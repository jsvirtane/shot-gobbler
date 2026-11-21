import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MatchClock } from "../types/Match";
import {
  adjustClock,
  clockMinute,
  clockStamp,
  elapsedMs,
  formatEventTime,
  formatMinute,
  NEW_CLOCK,
  nextPeriod,
  normalizeClock,
  parseMinuteInput,
  pauseClock,
  startClock,
} from "./matchClock";

const MIN = 60_000;
const T0 = new Date("2026-11-13T15:00:00Z").getTime();

describe("matchClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const later = (ms: number) => {
    vi.advanceTimersByTime(ms);
    return Date.now();
  };

  it("counts minutes from timestamps like a broadcast clock", () => {
    const clock = startClock(NEW_CLOCK, Date.now());
    expect(clockMinute(clock, Date.now())).toBe(1);
    expect(clockMinute(clock, later(59_999))).toBe(1);
    expect(clockMinute(clock, later(1))).toBe(2);
    expect(clockMinute(clock, later(21 * MIN + 30_000))).toBe(23);
  });

  it("keeps the last minute while paused and resumes from it", () => {
    let clock = startClock(NEW_CLOCK, Date.now());
    clock = pauseClock(clock, later(10 * MIN + 5_000));
    expect(clock).toMatchObject({ running: false, startedAt: null });
    expect(clockMinute(clock, later(30 * MIN))).toBe(11);

    clock = startClock(clock, Date.now());
    expect(clockMinute(clock, later(5 * MIN))).toBe(16);
    expect(elapsedMs(clock, Date.now())).toBe(15 * MIN + 5_000);
  });

  it("starts each period at its base minute, paused", () => {
    let clock = startClock(NEW_CLOCK, Date.now());
    later(47 * MIN);
    clock = nextPeriod(clock);
    expect(clock).toEqual({
      period: "2H",
      running: false,
      startedAt: null,
      elapsedBeforeStartMs: 0,
    });
    expect(clockMinute(clock, Date.now())).toBe(46);
    clock = nextPeriod(clock);
    expect(clockMinute(clock, Date.now())).toBe(91);
    clock = nextPeriod(clock);
    expect(clockMinute(clock, Date.now())).toBe(106);
    clock = nextPeriod(clock);
    expect(clock.period).toBe("PEN");
    expect(nextPeriod(clock)).toBe(clock);
    // The shoot-out has no running time
    expect(startClock(clock, Date.now())).toBe(clock);
  });

  it("adjusts by whole minutes, running or paused, not below zero", () => {
    let clock = startClock(NEW_CLOCK, Date.now());
    clock = adjustClock(clock, 1, later(30_000));
    expect(clockMinute(clock, Date.now())).toBe(2);
    expect(clockMinute(clock, later(MIN))).toBe(3);
    clock = adjustClock(clock, -5, Date.now());
    expect(elapsedMs(clock, Date.now())).toBe(0);

    const paused = adjustClock(NEW_CLOCK, 3, Date.now());
    expect(clockMinute(paused, later(10 * MIN))).toBe(4);
  });

  it("stamps events only once the clock has been used", () => {
    expect(clockStamp(undefined, Date.now())).toEqual({});
    const clock: MatchClock = { ...NEW_CLOCK, period: "2H" };
    expect(clockStamp(clock, Date.now())).toEqual({ minute: 46, period: "2H" });
  });

  it("formats minutes with added time", () => {
    expect(formatMinute(23)).toBe("23'");
    expect(formatMinute(45, "1H")).toBe("45'");
    expect(formatMinute(47, "1H")).toBe("45+2'");
    expect(formatMinute(93, "2H")).toBe("90+3'");
    expect(formatEventTime({ minute: 23, period: "1H" })).toBe("23' 1H");
    expect(formatEventTime({ minute: 12 })).toBe("12'");
    expect(formatEventTime({ minute: 120, period: "PEN" })).toBe("PEN");
    expect(formatEventTime({})).toBeNull();
  });

  it("reads stored clocks defensively", () => {
    expect(normalizeClock(null)).toBeNull();
    expect(normalizeClock({ period: "3H" })).toBeNull();
    expect(
      normalizeClock({ period: "2H", running: true, startedAt: null }),
    ).toEqual({
      period: "2H",
      running: false,
      startedAt: null,
      elapsedBeforeStartMs: 0,
    });
  });

  it("parses the minute typed on the minute dial", () => {
    expect(parseMinuteInput("")).toEqual({});
    expect(parseMinuteInput("abc")).toEqual({});
    expect(parseMinuteInput("12.5")).toEqual({});
    expect(parseMinuteInput("67")).toEqual({ minute: 67 });
  });
});

describe("futsal clock", () => {
  it("counts 20-minute halves and 5-minute extra time", () => {
    const stopped = (period: MatchClock["period"]): MatchClock => ({
      ...NEW_CLOCK,
      period,
    });
    expect(clockMinute(stopped("2H"), 0, "futsal")).toBe(21);
    expect(clockMinute(stopped("ET1"), 0, "futsal")).toBe(41);
    expect(clockMinute(stopped("ET2"), 0, "futsal")).toBe(46);
    expect(clockStamp(stopped("2H"), 0, "futsal")).toEqual({
      minute: 21,
      period: "2H",
    });
  });

  it("shows minutes past the period end as added time", () => {
    expect(formatMinute(22, "1H", "futsal")).toBe("20+2'");
    expect(formatMinute(22, "2H", "futsal")).toBe("22'");
    expect(formatEventTime({ minute: 43, period: "ET1" }, "futsal")).toBe(
      "43' ET1",
    );
  });
});
