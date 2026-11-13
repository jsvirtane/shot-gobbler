import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useToast } from "../components/Toast";
import { PASS_CHAINS_TAB, SHOTS_TAB, TOUCHES_TAB } from "../config/dataTabs";
import { Action } from "../types/Action";
import { EventMeta } from "../types/common";
import {
  DEFAULT_MATCH_ID,
  EventStamp,
  Match,
  MatchClock,
  MatchDetails,
} from "../types/Match";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import { downloadJson } from "../utils/dataTransfer";
import { clockStamp, NEW_CLOCK } from "../utils/matchClock";
import {
  cleanDetails,
  createDefaultMatch,
  createMatch,
  createMatchExport,
  createUntitledMatch,
  CURRENT_MATCH_STORAGE_KEY,
  formatMatchTitle,
  MATCHES_STORAGE_KEY,
  matchesCodec,
  parseMatchExport,
} from "../utils/matches";
import { notify } from "../utils/notify";
import { useLocalStorageState } from "./useLocalStorageState";

const NO_SHOTS: Shot[] = [];
const NO_ACTIONS: Action[] = [];
const NO_PASS_CHAINS: PassChain[] = [];
const INITIAL_MATCHES: Match[] = [createDefaultMatch()];

/** The match an event belongs to; old items without one use the default. */
export const matchIdOf = (item: EventMeta): string =>
  item.matchId ?? DEFAULT_MATCH_ID;

/** The items of one match, in their stored order. */
export const itemsOfMatch = <T extends EventMeta>(
  items: T[],
  matchId: string,
) => items.filter((item) => matchIdOf(item) === matchId);

/**
 * Turns a setter of all items into a setter of one match's items: the
 * update sees only that match's items, and whatever it returns becomes that
 * match's items (assigned to the match), leaving other matches untouched.
 */
export const scopeSetter =
  <T extends EventMeta>(
    setAll: Dispatch<SetStateAction<T[]>>,
    matchId: string,
  ): Dispatch<SetStateAction<T[]>> =>
  (update) =>
    setAll((all) => {
      const mine = itemsOfMatch(all, matchId);
      const next = typeof update === "function" ? update(mine) : update;
      return [
        ...all.filter((item) => matchIdOf(item) !== matchId),
        ...next.map((item) =>
          item.matchId === matchId ? item : { ...item, matchId },
        ),
      ];
    });

/** Puts back items removed earlier, skipping any that are already there. */
const restore =
  <T extends { id: string }>(removed: T[]) =>
  (prev: T[]): T[] => {
    const ids = new Set(prev.map((item) => item.id));
    return [...prev, ...removed.filter((item) => !ids.has(item.id))];
  };

/**
 * Matches and the data recorded in them. Shots, touches and pass chains are
 * stored in one list per type (each item has a matchId); the views get only
 * the current match's items and a setter scoped to that match.
 */
export function useMatchData() {
  const { showToast } = useToast();

  const [matches, setMatches] = useLocalStorageState(
    MATCHES_STORAGE_KEY,
    INITIAL_MATCHES,
    matchesCodec,
  );
  const [storedMatchId, setCurrentMatchId] = useLocalStorageState<string>(
    CURRENT_MATCH_STORAGE_KEY,
    DEFAULT_MATCH_ID,
  );
  const [allShots, setAllShots] = useLocalStorageState(
    SHOTS_TAB.storageKey,
    NO_SHOTS,
    SHOTS_TAB.codec,
  );
  const [allActions, setAllActions] = useLocalStorageState(
    TOUCHES_TAB.storageKey,
    NO_ACTIONS,
    TOUCHES_TAB.codec,
  );
  const [allPassChains, setAllPassChains] = useLocalStorageState(
    PASS_CHAINS_TAB.storageKey,
    NO_PASS_CHAINS,
    PASS_CHAINS_TAB.codec,
  );

  // Every item must belong to an existing match: data saved before matches
  // existed points at the default match, which is created when missing
  useEffect(() => {
    const known = new Set(matches.map((m) => m.id));
    const missing = new Set<string>();
    for (const item of [...allShots, ...allActions, ...allPassChains]) {
      const id = matchIdOf(item);
      if (!known.has(id)) missing.add(id);
    }
    if (missing.size === 0) return;
    setMatches((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const added = [...missing]
        .filter((id) => !ids.has(id))
        .map((id) =>
          id === DEFAULT_MATCH_ID
            ? createDefaultMatch()
            : createUntitledMatch(id),
        );
      return added.length > 0 ? [...prev, ...added] : prev;
    });
  }, [matches, allShots, allActions, allPassChains, setMatches]);

  const currentMatch: Match =
    matches.find((m) => m.id === storedMatchId) ??
    matches[0] ??
    INITIAL_MATCHES[0];
  const matchId = currentMatch.id;

  const shots = useMemo(
    () => itemsOfMatch(allShots, matchId),
    [allShots, matchId],
  );
  const actions = useMemo(
    () => itemsOfMatch(allActions, matchId),
    [allActions, matchId],
  );
  const passChains = useMemo(
    () => itemsOfMatch(allPassChains, matchId),
    [allPassChains, matchId],
  );
  const setShots = useMemo(
    () => scopeSetter(setAllShots, matchId),
    [setAllShots, matchId],
  );
  const setActions = useMemo(
    () => scopeSetter(setAllActions, matchId),
    [setAllActions, matchId],
  );
  const setPassChains = useMemo(
    () => scopeSetter(setAllPassChains, matchId),
    [setAllPassChains, matchId],
  );

  const clock = currentMatch.clock;

  /** Fields a new event gets from the current match and its clock. */
  const getEventStamp = useCallback(
    (): EventStamp => ({ matchId, ...clockStamp(clock, Date.now()) }),
    [matchId, clock],
  );

  /** Changes the current match's clock (created on first use). */
  const updateClock = useCallback(
    (change: (clock: MatchClock, now: number) => MatchClock | undefined) => {
      const now = Date.now();
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          const next = change(m.clock ?? NEW_CLOCK, now);
          if (next) return { ...m, clock: next };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { clock, ...rest } = m;
          return rest;
        }),
      );
    },
    [setMatches, matchId],
  );

  const selectMatch = useCallback(
    (id: string) => setCurrentMatchId(id),
    [setCurrentMatchId],
  );

  const addMatch = useCallback(
    (details: MatchDetails) => {
      const match = createMatch(details);
      setMatches((prev) => [...prev, match]);
      setCurrentMatchId(match.id);
      return match;
    },
    [setMatches, setCurrentMatchId],
  );

  const updateMatch = useCallback(
    (id: string, details: MatchDetails) => {
      const cleaned = cleanDetails(details);
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          // Drop a cleared competition instead of keeping the old one
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { competition, ...rest } = m;
          return { ...rest, ...cleaned };
        }),
      );
    },
    [setMatches],
  );

  /** Copies the match details (not its data) into a new current match. */
  const duplicateMatch = useCallback(
    (id: string) => {
      const source = matches.find((m) => m.id === id);
      if (!source) return;
      addMatch({
        homeTeam: source.homeTeam,
        awayTeam: source.awayTeam,
        date: source.date,
        competition: source.competition,
      });
    },
    [matches, addMatch],
  );

  /** Deletes a match and its data, with Undo. The last match is kept. */
  const deleteMatch = useCallback(
    (id: string) => {
      const index = matches.findIndex((m) => m.id === id);
      if (index === -1 || matches.length <= 1) return;
      const match = matches[index];
      const removed = {
        shots: itemsOfMatch(allShots, id),
        actions: itemsOfMatch(allActions, id),
        passChains: itemsOfMatch(allPassChains, id),
      };
      const notThisMatch = <T extends EventMeta>(items: T[]) =>
        items.filter((item) => matchIdOf(item) !== id);

      setMatches((prev) => prev.filter((m) => m.id !== id));
      setAllShots(notThisMatch);
      setAllActions(notThisMatch);
      setAllPassChains(notThisMatch);
      if (id === matchId) {
        const next = matches[index + 1] ?? matches[index - 1];
        setCurrentMatchId(next.id);
      }

      showToast({
        message: `Deleted ${formatMatchTitle(match)}`,
        action: {
          label: "Undo",
          onClick: () => {
            setMatches((prev) => {
              if (prev.some((m) => m.id === id)) return prev;
              const at = Math.min(index, prev.length);
              return [...prev.slice(0, at), match, ...prev.slice(at)];
            });
            setAllShots(restore(removed.shots));
            setAllActions(restore(removed.actions));
            setAllPassChains(restore(removed.passChains));
          },
        },
      });
    },
    [
      matches,
      matchId,
      allShots,
      allActions,
      allPassChains,
      setMatches,
      setAllShots,
      setAllActions,
      setAllPassChains,
      setCurrentMatchId,
      showToast,
    ],
  );

  /** Downloads the current match with all its data as one file. */
  const exportMatch = useCallback(() => {
    const name = formatMatchTitle(currentMatch)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    downloadJson(
      createMatchExport(currentMatch, shots, actions, passChains),
      `match_${name || "match"}_${currentMatch.date}.json`,
    );
  }, [currentMatch, shots, actions, passChains]);

  /** Adds an "Export match" file as a new match and switches to it. */
  const importMatch = useCallback(
    (parsed: unknown) => {
      const result = parseMatchExport(parsed);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      setMatches((prev) => [...prev, result.match]);
      setAllShots((prev) => [...prev, ...result.shots]);
      setAllActions((prev) => [...prev, ...result.touches]);
      setAllPassChains((prev) => [...prev, ...result.passChains]);
      setCurrentMatchId(result.match.id);

      const counts = [
        `${result.shots.length} shots`,
        `${result.touches.length} touches`,
        `${result.passChains.length} pass chains`,
      ].join(", ");
      const skipped =
        result.skipped > 0
          ? ` Skipped ${result.skipped} invalid ${result.skipped === 1 ? "item" : "items"}.`
          : "";
      notify(
        `Imported ${formatMatchTitle(result.match)}: ${counts}.${skipped}`,
        "success",
      );
    },
    [
      setMatches,
      setAllShots,
      setAllActions,
      setAllPassChains,
      setCurrentMatchId,
    ],
  );

  return {
    matches,
    currentMatch,
    shots,
    setShots,
    actions,
    setActions,
    passChains,
    setPassChains,
    getEventStamp,
    updateClock,
    selectMatch,
    addMatch,
    updateMatch,
    duplicateMatch,
    deleteMatch,
    exportMatch,
    importMatch,
  };
}
