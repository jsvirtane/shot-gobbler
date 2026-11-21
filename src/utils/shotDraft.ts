import { Team } from "../types/common";
import {
  BodyPart,
  isSpotKick,
  Shot,
  ShotResult,
  ShotType,
  SpotKickType,
} from "../types/Shot";
import { DEFAULT_PITCH_TYPE, PitchType } from "../types/Pitch";
import { fromMetres } from "./pitchGeometry";
import { pitchSpec } from "./pitchSpecs";
import { mirrorPoint, PitchPoint, toAttackingHalf } from "./pitchView";

/**
 * A shot being recorded or edited in the radial menu. Coordinates are
 * stored full-pitch %, always in the team's attacking half.
 */
export type ShotDraft = PitchPoint & {
  team: Team;
  bodyPart: BodyPart;
  shotType: ShotType;
  playerName?: string;
  minute?: number;
  /**
   * Where the shot was before Penalty (or the 10 m kick) moved it to its
   * mark, so turning it off puts it back.
   */
  spot: PitchPoint;
};

/** Distance (m) of the spot kick's mark from the goal line, if the pitch has one. */
const markDistance = (
  type: SpotKickType,
  pitch: PitchType,
): number | undefined => {
  const spec = pitchSpec(pitch);
  return type === "Penalty" ? spec.penaltySpotM : spec.secondPenaltySpotM;
};

/** Whether the spot kick exists on the pitch (the 10 m kick is futsal only). */
export const hasSpotKick = (
  type: SpotKickType,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): boolean => markDistance(type, pitch) !== undefined;

/**
 * The mark (stored %) a spot kick is taken from, in front of the goal the
 * team attacks. Null when the pitch has no such mark.
 */
export const spotKickMark = (
  type: SpotKickType,
  team: Team,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): PitchPoint | null => {
  const distance = markDistance(type, pitch);
  if (distance === undefined) return null;
  const { widthM, lengthM } = pitchSpec(pitch);
  return fromMetres(
    { x: widthM / 2, y: team === "home" ? distance : lengthM - distance },
    pitch,
  );
};

/** Penalty spot (stored %) of the goal the team attacks. */
export const penaltySpot = (
  team: Team,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): PitchPoint => spotKickMark("Penalty", team, pitch)!;

/**
 * A new shot at a pitch point (stored %). The team defaults to the one
 * attacking the half tapped; the point is moved into that team's attacking
 * half. Toggles start at Foot / Open play.
 */
export const newShotDraft = (
  point: PitchPoint,
  team: Team,
  minute?: number,
): ShotDraft => {
  const at = toAttackingHalf({ x: point.x, y: point.y }, team);
  return {
    ...at,
    spot: at,
    team,
    bodyPart: "Foot",
    shotType: "Open Play",
    minute,
  };
};

/** A draft holding an existing shot's values. */
export const draftFromShot = (shot: Shot): ShotDraft => ({
  x: shot.x,
  y: shot.y,
  spot: { x: shot.x, y: shot.y },
  team: shot.team,
  bodyPart: shot.bodyPart,
  shotType: shot.shotType,
  playerName: shot.playerName || undefined,
  minute: shot.minute,
});

/**
 * Switches the team. The shot keeps its place relative to the goal it is
 * aimed at, so it moves to the other team's attacking half (and xG stays
 * the same).
 */
export const switchDraftTeam = (draft: ShotDraft): ShotDraft => {
  const team: Team = draft.team === "home" ? "away" : "home";
  return {
    ...draft,
    ...mirrorPoint({ x: draft.x, y: draft.y }),
    spot: mirrorPoint(draft.spot),
    team,
  };
};

/** Where a spot kick was before it moved to its mark; otherwise unchanged. */
const leaveMark = (draft: ShotDraft): PitchPoint =>
  isSpotKick(draft.shotType)
    ? { x: draft.spot.x, y: draft.spot.y }
    : { x: draft.x, y: draft.y };

/** Header on / off (off is Foot). A header is never a spot kick. */
export const toggleHead = (draft: ShotDraft): ShotDraft => {
  if (draft.bodyPart === "Head") return { ...draft, bodyPart: "Foot" };
  const next: ShotDraft = { ...draft, bodyPart: "Head" };
  return isSpotKick(draft.shotType)
    ? { ...next, ...leaveMark(draft), shotType: "Open Play" }
    : next;
};

/** Set piece on / off; it excludes the spot kicks. */
export const toggleSetPiece = (draft: ShotDraft): ShotDraft => {
  if (draft.shotType === "Set Piece") {
    return { ...draft, shotType: "Open Play" };
  }
  return { ...draft, ...leaveMark(draft), shotType: "Set Piece" };
};

/**
 * A spot kick on: moves the shot to its mark and clears Head and Set
 * piece. Off: back to open play where it was before. Unchanged when the
 * pitch has no such mark.
 */
export const toggleSpotKick = (
  draft: ShotDraft,
  type: SpotKickType,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): ShotDraft => {
  if (draft.shotType === type) {
    return { ...draft, ...leaveMark(draft), shotType: "Open Play" };
  }
  const mark = spotKickMark(type, draft.team, pitch);
  if (!mark) return draft;
  return {
    ...draft,
    ...mark,
    // Remember where it was, also when switching from the other spot kick
    spot: leaveMark(draft),
    shotType: type,
    bodyPart: draft.bodyPart === "Head" ? "Foot" : draft.bodyPart,
  };
};

/** Penalty on / off (see `toggleSpotKick`). */
export const togglePenalty = (
  draft: ShotDraft,
  pitch: PitchType = DEFAULT_PITCH_TYPE,
): ShotDraft => toggleSpotKick(draft, "Penalty", pitch);

/** The shot fields a draft saves with the chosen result. */
export const draftToShotFields = (
  draft: ShotDraft,
  result: ShotResult,
): Omit<Shot, "id" | "timestamp" | "matchId" | "period"> => ({
  x: draft.x,
  y: draft.y,
  team: draft.team,
  bodyPart: draft.bodyPart,
  shotType: draft.shotType,
  playerName: draft.playerName,
  minute: draft.minute,
  result,
  isGoal: result === "Goal",
});

/** Short label for the shirt option: "#9", a short name, or "Shirt #". */
export const shirtLabel = (playerName?: string): string => {
  if (!playerName) return "Shirt #";
  if (/^\d+$/.test(playerName)) return `#${playerName}`;
  return playerName.length > 7 ? `${playerName.slice(0, 6)}…` : playerName;
};

/** Up to this many digits on the dial. */
export const DIAL_MAX_DIGITS = { shirt: 2, minute: 3 } as const;

/** Adds a digit to a dial value, ignoring it past the limit. */
export const dialAppend = (value: string, digit: string, max: number) =>
  value.length >= max ? value : value === "0" ? digit : value + digit;
