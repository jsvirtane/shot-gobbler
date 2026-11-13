import { Action } from "../types/Action";
import {
  DEFAULT_MATCH_ID,
  Match,
  MatchDetails,
  TeamNames,
} from "../types/Match";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import {
  APP_ID,
  createEnvelope,
  DataEnvelope,
  parseStored,
  serializeForStorage,
  StorageCodec,
} from "./dataSchema";
import { validateImport } from "./importValidation";
import { getTeamLabels } from "./teamLabels";
import { normalizeClock } from "./matchClock";

export const MATCHES_STORAGE_KEY = "shot-gobbler-matches";
export const CURRENT_MATCH_STORAGE_KEY = "shot-gobbler-current-match";

/** Envelope type of an "Export match" file. */
export const MATCH_EXPORT_TYPE = "match";
export const MATCH_EXPORT_VERSION = 1;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date as YYYY-MM-DD in local time. */
export const todayIso = (now = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const createMatchId = () =>
  `match-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/** A match with no team names; shown as "Untitled match". */
export const createUntitledMatch = (id: string = createMatchId()): Match => ({
  id,
  homeTeam: "",
  awayTeam: "",
  date: todayIso(),
  createdAt: Date.now(),
});

export const createMatch = (details: MatchDetails): Match => ({
  ...cleanDetails(details),
  id: createMatchId(),
  createdAt: Date.now(),
});

/** Trims names and drops an empty competition. */
export const cleanDetails = (details: MatchDetails): MatchDetails => {
  const competition = details.competition?.trim();
  return {
    homeTeam: details.homeTeam.trim(),
    awayTeam: details.awayTeam.trim(),
    date: DATE_PATTERN.test(details.date) ? details.date : todayIso(),
    ...(competition ? { competition } : {}),
  };
};

export const getTeamNames = (match: Match | undefined): TeamNames =>
  getTeamLabels(match);

/** "Home vs Away", or "Untitled match" when neither team is named. */
export const formatMatchTitle = (match: Match): string => {
  if (!match.homeTeam.trim() && !match.awayTeam.trim()) {
    return "Untitled match";
  }
  const { home, away } = getTeamNames(match);
  return `${home} vs ${away}`;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalString = (value: unknown) =>
  typeof value === "string" ? value : "";

/** Returns a valid Match from stored or imported data, or null. */
export const normalizeMatch = (item: unknown): Match | null => {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string" || item.id === "") return null;
  const competition = optionalString(item.competition).trim();
  const clock = normalizeClock(item.clock);
  return {
    id: item.id,
    homeTeam: optionalString(item.homeTeam),
    awayTeam: optionalString(item.awayTeam),
    date:
      typeof item.date === "string" && DATE_PATTERN.test(item.date)
        ? item.date
        : todayIso(),
    ...(competition ? { competition } : {}),
    createdAt:
      typeof item.createdAt === "number" && Number.isFinite(item.createdAt)
        ? item.createdAt
        : Date.now(),
    ...(clock ? { clock } : {}),
  };
};

/** Stores matches in an envelope; an empty or unusable list falls back. */
export const matchesCodec: StorageCodec<Match[]> = {
  parse: (raw) => {
    const data = parseStored(raw, "matches");
    if (!data) return null;
    const matches = data
      .map(normalizeMatch)
      .filter((m): m is Match => m !== null);
    return matches.length > 0 ? matches : null;
  },
  stringify: (value) => serializeForStorage("matches", value),
};

/** The match old data is assigned to; created whenever it is missing. */
export const createDefaultMatch = (): Match =>
  createUntitledMatch(DEFAULT_MATCH_ID);

export type MatchExport = {
  app: typeof APP_ID;
  type: typeof MATCH_EXPORT_TYPE;
  version: number;
  match: Match;
  shots: DataEnvelope<Shot>;
  touches: DataEnvelope<Action>;
  passChains: DataEnvelope<PassChain>;
};

export const createMatchExport = (
  match: Match,
  shots: Shot[],
  touches: Action[],
  passChains: PassChain[],
): MatchExport => ({
  app: APP_ID,
  type: MATCH_EXPORT_TYPE,
  version: MATCH_EXPORT_VERSION,
  match,
  shots: createEnvelope("shots", shots),
  touches: createEnvelope("touches", touches),
  passChains: createEnvelope("pass-chains", passChains),
});

/** True when parsed JSON is an "Export match" file. */
export const isMatchExport = (value: unknown): boolean =>
  isRecord(value) && value.app === APP_ID && value.type === MATCH_EXPORT_TYPE;

export type MatchImportResult =
  | {
      ok: true;
      match: Match;
      shots: Shot[];
      touches: Action[];
      passChains: PassChain[];
      skipped: number;
    }
  | { ok: false; error: string };

/**
 * Reads an "Export match" file into a new match (with a fresh id) and its
 * items, all assigned to that match. Invalid items are skipped.
 */
export const parseMatchExport = (value: unknown): MatchImportResult => {
  if (!isRecord(value) || !isMatchExport(value)) {
    return { ok: false, error: "This file is not a match export." };
  }
  const source = normalizeMatch(value.match);
  if (!source) {
    return { ok: false, error: "The match file has no valid match details." };
  }
  const match: Match = {
    ...source,
    id: createMatchId(),
    createdAt: Date.now(),
  };

  let skipped = 0;
  const read = <T>(
    section: unknown,
    validate: (data: unknown) => ReturnType<typeof validateImport>,
  ): T[] => {
    const result = validate(section);
    if (!result.ok) {
      // An empty section is fine; anything else counts as skipped items
      if (isRecord(section) && Array.isArray(section.data)) {
        skipped += section.data.length;
      }
      return [];
    }
    skipped += result.skipped;
    return (result.items as T[]).map((item) => ({
      ...item,
      matchId: match.id,
    }));
  };

  return {
    ok: true,
    match,
    shots: read<Shot>(value.shots, (d) => validateImport(d, "shots")),
    touches: read<Action>(value.touches, (d) => validateImport(d, "touches")),
    passChains: read<PassChain>(value.passChains, (d) =>
      validateImport(d, "pass-chains"),
    ),
    skipped,
  };
};
