/**
 * Versioned envelope for data kept in localStorage and written to export
 * files. Each data type has its own migration chain: MIGRATIONS[type][n]
 * turns version n data into version n + 1. A bare array (the format used
 * before envelopes existed) is version 0.
 */

export const APP_ID = "shot-gobbler";

export type DataType = "shots" | "touches" | "pass-chains";

export const DATA_TYPES: readonly DataType[] = [
  "shots",
  "touches",
  "pass-chains",
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

export const MIGRATIONS: Record<DataType, readonly Migration[]> = {
  shots: [wrapInEnvelope],
  touches: [wrapInEnvelope],
  "pass-chains": [wrapInEnvelope],
};

export const CURRENT_VERSION: Record<DataType, number> = {
  shots: MIGRATIONS.shots.length,
  touches: MIGRATIONS.touches.length,
  "pass-chains": MIGRATIONS["pass-chains"].length,
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
