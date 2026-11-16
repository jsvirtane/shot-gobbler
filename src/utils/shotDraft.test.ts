import { describe, expect, it } from "vitest";
import { Shot } from "../types/Shot";
import { attackedGoal, distanceToGoal, toMetres } from "./pitchGeometry";
import {
  dialAppend,
  draftFromShot,
  draftToShotFields,
  newShotDraft,
  penaltySpot,
  shirtLabel,
  switchDraftTeam,
  toggleHead,
  togglePenalty,
  toggleSetPiece,
} from "./shotDraft";
import { PENALTY_XG, shotXg } from "./xg";

describe("penaltySpot", () => {
  it("is 11 m from the goal the team attacks, in the middle", () => {
    const home = penaltySpot("home");
    expect(attackedGoal(home)).toBe("top");
    expect(distanceToGoal(home, "top")).toBeCloseTo(11, 5);
    expect(toMetres(home).x).toBeCloseTo(34, 5);

    const away = penaltySpot("away");
    expect(attackedGoal(away)).toBe("bottom");
    expect(distanceToGoal(away, "bottom")).toBeCloseTo(11, 5);
  });
});

describe("newShotDraft", () => {
  it("starts at Foot / Open play at the point", () => {
    expect(newShotDraft({ x: 30, y: 20 }, "home", 12)).toEqual({
      x: 30,
      y: 20,
      spot: { x: 30, y: 20 },
      team: "home",
      bodyPart: "Foot",
      shotType: "Open Play",
      minute: 12,
    });
  });

  it("puts the point in the team's attacking half", () => {
    // Half view: an away shot tapped near the top goal
    expect(newShotDraft({ x: 30, y: 20 }, "away")).toMatchObject({
      x: 70,
      y: 80,
    });
  });
});

describe("switchDraftTeam", () => {
  it("mirrors the shot so it keeps its distance and angle to goal", () => {
    const draft = newShotDraft({ x: 30, y: 85 }, "away");
    const switched = switchDraftTeam(draft);
    expect(switched).toMatchObject({ team: "home", x: 70, y: 15 });
    expect(attackedGoal(switched)).toBe("top");
    expect(shotXg(switched)).toBeCloseTo(shotXg(draft), 10);
    expect(switchDraftTeam(switched)).toEqual(draft);
  });
});

describe("toggles", () => {
  const draft = newShotDraft({ x: 30, y: 30 }, "home");

  it("Head switches between Head and Foot", () => {
    expect(toggleHead(draft).bodyPart).toBe("Head");
    expect(toggleHead(toggleHead(draft)).bodyPart).toBe("Foot");
  });

  it("Penalty moves to the spot, clears Head and Set piece, and back", () => {
    const pen = togglePenalty(toggleSetPiece(toggleHead(draft)));
    expect(pen).toMatchObject({
      ...penaltySpot("home"),
      shotType: "Penalty",
      bodyPart: "Foot",
    });
    expect(shotXg(pen)).toBe(PENALTY_XG);
    expect(togglePenalty(pen)).toMatchObject({
      x: 30,
      y: 30,
      shotType: "Open Play",
    });
  });

  it("Set piece turns Penalty off and puts the shot back", () => {
    const set = toggleSetPiece(togglePenalty(draft));
    expect(set).toMatchObject({ x: 30, y: 30, shotType: "Set Piece" });
    expect(toggleSetPiece(set).shotType).toBe("Open Play");
  });

  it("Head turns Penalty off", () => {
    const head = toggleHead(togglePenalty(draft));
    expect(head).toMatchObject({
      x: 30,
      y: 30,
      bodyPart: "Head",
      shotType: "Open Play",
    });
  });

  it("a penalty switched to the other team is at that team's spot", () => {
    const switched = switchDraftTeam(togglePenalty(draft));
    expect(switched.x).toBeCloseTo(penaltySpot("away").x, 10);
    expect(switched.y).toBeCloseTo(penaltySpot("away").y, 10);
    expect(togglePenalty(switched)).toMatchObject({ x: 70, y: 70 });
  });
});

describe("draft and shot", () => {
  const shot: Shot = {
    id: "s1",
    x: 40,
    y: 70,
    team: "away",
    result: "Saved",
    isGoal: false,
    bodyPart: "Other",
    shotType: "Set Piece",
    playerName: "9",
    timestamp: 1,
    matchId: "m1",
    minute: 67,
    period: "2H",
  };

  it("round-trips a shot's editable fields", () => {
    const fields = draftToShotFields(draftFromShot(shot), "Saved");
    expect({ ...shot, ...fields }).toEqual(shot);
  });

  it("sets isGoal from the result", () => {
    const draft = draftFromShot(shot);
    expect(draftToShotFields(draft, "Goal")).toMatchObject({
      result: "Goal",
      isGoal: true,
    });
  });
});

describe("shirtLabel", () => {
  it("shows a number with #, a name shortened, or the option name", () => {
    expect(shirtLabel("9")).toBe("#9");
    expect(shirtLabel("Saka")).toBe("Saka");
    expect(shirtLabel("Martinelli")).toBe("Martin…");
    expect(shirtLabel(undefined)).toBe("Shirt #");
  });
});

describe("dialAppend", () => {
  it("adds digits up to the limit and replaces a lone zero", () => {
    expect(dialAppend("", "7", 2)).toBe("7");
    expect(dialAppend("1", "0", 2)).toBe("10");
    expect(dialAppend("10", "4", 2)).toBe("10");
    expect(dialAppend("0", "5", 3)).toBe("5");
  });
});
