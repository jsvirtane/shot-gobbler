import { describe, expect, it } from "vitest";
import { Match } from "../types/Match";
import { Shot } from "../types/Shot";
import {
  createMatchExport,
  formatMatchTitle,
  getPitchType,
  getTeamNames,
  matchesCodec,
  normalizeMatch,
  parseMatchExport,
} from "./matches";

const match: Match = {
  id: "m1",
  homeTeam: "Arsenal",
  awayTeam: "",
  date: "2026-11-01",
  createdAt: 1,
};

const shot: Shot = {
  id: "s1",
  x: 50,
  y: 20,
  isGoal: true,
  result: "Goal",
  bodyPart: "Foot",
  shotType: "Open Play",
  team: "home",
  timestamp: 1,
  matchId: "m1",
};

describe("matches", () => {
  it("falls back to Home / Away and Untitled match", () => {
    expect(getTeamNames(match)).toEqual({ home: "Arsenal", away: "Away" });
    expect(formatMatchTitle(match)).toBe("Arsenal vs Away");
    expect(formatMatchTitle({ ...match, homeTeam: " " })).toBe(
      "Untitled match",
    );
  });

  it("normalizes stored matches", () => {
    expect(normalizeMatch({ id: "" })).toBeNull();
    expect(normalizeMatch({ id: "x", date: "bad" })).toMatchObject({
      id: "x",
      homeTeam: "",
      awayTeam: "",
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
  });

  it("treats an empty stored list as unusable", () => {
    expect(matchesCodec.parse(matchesCodec.stringify([]))).toBeNull();
    expect(matchesCodec.parse(matchesCodec.stringify([match]))).toEqual([
      match,
    ]);
  });

  it("reads a match export into a new match and skips invalid items", () => {
    const file = JSON.parse(
      JSON.stringify(createMatchExport(match, [shot], [], [])),
    );
    file.shots.data.push({ nonsense: true });

    const result = parseMatchExport(file);
    if (!result.ok) throw new Error(result.error);
    expect(result.match).toMatchObject({ homeTeam: "Arsenal" });
    expect(result.match.id).not.toBe("m1");
    expect(result.shots).toHaveLength(1);
    expect(result.shots[0].matchId).toBe(result.match.id);
    expect(result.touches).toEqual([]);
    expect(result.skipped).toBe(1);
  });

  it("refuses a match file without match details", () => {
    expect(
      parseMatchExport({ app: "shot-gobbler", type: "match", match: null }),
    ).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe("pitch type", () => {
  it("keeps futsal and drops football and unknown values", () => {
    expect(normalizeMatch({ id: "x", pitchType: "futsal" })).toMatchObject({
      pitchType: "futsal",
    });
    expect(
      normalizeMatch({ id: "x", pitchType: "football" }),
    ).not.toHaveProperty("pitchType");
    expect(normalizeMatch({ id: "x", pitchType: "beach" })).not.toHaveProperty(
      "pitchType",
    );
  });

  it("defaults to football", () => {
    expect(getPitchType(match)).toBe("football");
    expect(getPitchType(undefined)).toBe("football");
    expect(getPitchType({ ...match, pitchType: "futsal" })).toBe("futsal");
  });

  it("keeps the pitch type through a match export", () => {
    const result = parseMatchExport(
      createMatchExport({ ...match, pitchType: "futsal" }, [], [], []),
    );
    expect(result.ok && result.match.pitchType).toBe("futsal");
  });
});
