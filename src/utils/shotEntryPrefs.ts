import { Team } from "../types/common";
import { BodyPart, ShotType } from "../types/Shot";

export const SHOT_DEFAULTS_STORAGE_KEY = "shot-gobbler-shot-defaults";
export const QUICK_MODE_STORAGE_KEY = "shot-gobbler-quick-mode";

/** Form choices remembered between shots. The result is not remembered. */
export type ShotDefaults = {
  team: Team;
  bodyPart: BodyPart;
  shotType: ShotType;
  playerName: string;
};

export const FALLBACK_SHOT_DEFAULTS: ShotDefaults = {
  team: "home",
  bodyPart: "Foot",
  shotType: "Open Play",
  playerName: "",
};

const TEAMS: readonly Team[] = ["home", "away"];
const BODY_PARTS: readonly BodyPart[] = ["Foot", "Head", "Other"];
const SHOT_TYPES: readonly ShotType[] = ["Open Play", "Set Piece", "Penalty"];

const pick = <T>(allowed: readonly T[], value: unknown, fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Reads remembered shot choices; falls back to defaults if storage is unavailable or invalid. */
export const loadShotDefaults = (): ShotDefaults => {
  try {
    const raw = localStorage.getItem(SHOT_DEFAULTS_STORAGE_KEY);
    if (!raw) return FALLBACK_SHOT_DEFAULTS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return FALLBACK_SHOT_DEFAULTS;
    const data = parsed as Record<string, unknown>;
    return {
      team: pick(TEAMS, data.team, FALLBACK_SHOT_DEFAULTS.team),
      bodyPart: pick(
        BODY_PARTS,
        data.bodyPart,
        FALLBACK_SHOT_DEFAULTS.bodyPart,
      ),
      shotType: pick(
        SHOT_TYPES,
        data.shotType,
        FALLBACK_SHOT_DEFAULTS.shotType,
      ),
      playerName: typeof data.playerName === "string" ? data.playerName : "",
    };
  } catch {
    return FALLBACK_SHOT_DEFAULTS;
  }
};

export const saveShotDefaults = (defaults: ShotDefaults): void => {
  try {
    localStorage.setItem(SHOT_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    // Storage unavailable (private mode, quota); keep working in memory
  }
};

export const loadQuickMode = (): boolean => {
  try {
    return localStorage.getItem(QUICK_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const saveQuickMode = (enabled: boolean): void => {
  try {
    localStorage.setItem(QUICK_MODE_STORAGE_KEY, String(enabled));
  } catch {
    // Storage unavailable; the toggle still works for this session
  }
};
