/**
 * Versioned envelope for data kept in localStorage and written to export
 * files. Each data type has its own migration chain: MIGRATIONS[type][n]
 * turns version n data into version n + 1. A bare array (the format used
 * before envelopes existed) is version 0.
 */

import { DEFAULT_MATCH_ID } from "../types/Match";
import { DataTab } from "../types/Tab";

export const APP_ID = "shot-gobbler";

/** Data tabs plus the stored list of matches. */
export type DataType = DataTab | "matches";

export const DATA_TYPES: readonly DataType[] = [
  "shots",
  "touches",
  "pass-chains",
  "matches",
];

export type DataEnvelope<T = unknown> = {
  app: typeof APP_ID;
  type: DataType;
  version: number;
  data: T[];
};

export type Migration = (data: unknown[]) => unknown[];

/** v0 → v1: bare array wrapped in an envelope; items are unchanged. */
const wrapInEnvelope: Migration = (data) => data;

/** Touches v1 → v2: outcome "posession-won" renamed to "possession-won". */
export const fixPossessionWonTypo: Migration = (data) =>
  data.map((item) =>
    typeof item === "object" &&
    item !== null &&
    (item as Record<string, unknown>).outcome === "posession-won"
      ? { ...item, outcome: "possession-won" }
      : item,
  );

/**
 * Shots v1 → v2, touches v2 → v3, pass chains v1 → v2: items recorded before
 * matches existed are assigned to the default match.
 */
export const assignDefaultMatch: Migration = (data) =>
  data.map((item) =>
    typeof item === "object" &&
    item !== null &&
    typeof (item as Record<string, unknown>).matchId !== "string"
      ? { ...item, matchId: DEFAULT_MATCH_ID }
      : item,
  );

export const MIGRATIONS: Record<DataType, readonly Migration[]> = {
  shots: [wrapInEnvelope, assignDefaultMatch],
  touches: [wrapInEnvelope, fixPossessionWonTypo, assignDefaultMatch],
  "pass-chains": [wrapInEnvelope, assignDefaultMatch],
  matches: [wrapInEnvelope],
};

export const CURRENT_VERSION: Record<DataType, number> = {
  shots: MIGRATIONS.shots.length,
  touches: MIGRATIONS.touches.length,
  "pass-chains": MIGRATIONS["pass-chains"].length,
  matches: MIGRATIONS.matches.length,
};

export const isDataType = (value: unknown): value is DataType =>
  typeof value === "string" && DATA_TYPES.includes(value as DataType);

/** True when the value looks like a shot-gobbler envelope (any type). */
export const isEnvelope = (value: unknown): value is DataEnvelope => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.app === APP_ID &&
    isDataType(record.type) &&
    typeof record.version === "number" &&
    Number.isInteger(record.version) &&
    record.version >= 0 &&
    Array.isArray(record.data)
  );
};

/** Wraps data in an envelope at the current version for its type. */
export const createEnvelope = <T>(
  type: DataType,
  data: T[],
): DataEnvelope<T> => ({
  app: APP_ID,
  type,
  version: CURRENT_VERSION[type],
  data,
});

/**
 * Runs data of the given type from `fromVersion` up to the current version.
 * Data from a newer version than this app knows is returned unchanged.
 */
export const migrate = (
  type: DataType,
  data: unknown[],
  fromVersion: number,
): unknown[] =>
  MIGRATIONS[type]
    .slice(fromVersion)
    .reduce((current, step) => step(current), data);

export type UnwrapResult =
  | { ok: true; data: unknown[] }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "wrong-type"; actualType: DataType };

/**
 * Accepts a bare array (version 0) or an envelope and returns its items
 * migrated to the current version of `expectedType`.
 */
export const unwrapAndMigrate = (
  value: unknown,
  expectedType: DataType,
): UnwrapResult => {
  if (Array.isArray(value)) {
    return { ok: true, data: migrate(expectedType, value, 0) };
  }
  if (!isEnvelope(value)) return { ok: false, reason: "invalid" };
  if (value.type !== expectedType) {
    return { ok: false, reason: "wrong-type", actualType: value.type };
  }
  return { ok: true, data: migrate(expectedType, value.data, value.version) };
};

/**
 * Reads stored JSON (bare array or envelope). Returns null when the value
 * is missing or cannot be used, so the caller can fall back to a default.
 */
export const parseStored = (
  raw: string | null,
  type: DataType,
): unknown[] | null => {
  if (raw === null) return null;
  const result = unwrapAndMigrate(JSON.parse(raw), type);
  return result.ok ? result.data : null;
};

export const serializeForStorage = <T>(type: DataType, data: T[]): string =>
  JSON.stringify(createEnvelope(type, data));

/** How a value is turned into a localStorage string and back. */
export type StorageCodec<T> = {
  /** Returns null when the stored value cannot be used. May throw. */
  parse: (raw: string) => T | null;
  stringify: (value: T) => string;
};

/** Plain JSON with no envelope or migrations. */
export const jsonCodec: StorageCodec<unknown> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (value) => JSON.stringify(value),
};

/** Stores an array in a versioned envelope and migrates it on load. */
export const envelopeCodec = <T>(type: DataType): StorageCodec<T[]> => ({
  parse: (raw) => parseStored(raw, type) as T[] | null,
  stringify: (value) => serializeForStorage(type, value),
});
