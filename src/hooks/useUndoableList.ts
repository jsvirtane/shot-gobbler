import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useToast } from "../components/Toast";
import { ToastOptions } from "../components/Toast/toastContext";

type Nouns = {
  /** Capitalised singular, e.g. "Shot". */
  one: string;
  /** Lower-case plural, e.g. "shots". */
  many: string;
};

/** One change that can still be undone. */
type HistoryEntry = {
  id: number;
  /** What was done, e.g. "Shot added". */
  message: string;
  revert: () => void;
  toastId: number;
};

/** Older changes are dropped beyond this. */
const MAX_HISTORY = 50;

/**
 * Add, update, remove and clear-all for a list of items with ids, each showing a
 * toast with an Undo button. Undo uses functional updates keyed by id, so
 * it stays correct when other changes happened in between.
 *
 * The changes are also kept in a history, so `undoLast` (e.g. the focus
 * mode bar's undo button) reverts them one by one, newest first. A toast's
 * own Undo button reverts its change and takes it out of the history.
 */
export function useUndoableList<T extends { id: string }>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  nouns: Nouns,
) {
  const { showToast, dismissToast } = useToast();
  const { one, many } = nouns;
  // Only the latest "added" toast is kept, so rapid entry doesn't stack them
  const lastAddToast = useRef<number | null>(null);

  const history = useRef<HistoryEntry[]>([]);
  const nextEntryId = useRef(1);
  const [historySize, setHistorySize] = useState(0);

  // Changes belong to one match: a new (match-scoped) setter starts afresh
  useEffect(() => {
    history.current = [];
    setHistorySize(0);
  }, [setItems]);

  const undoEntry = useCallback((id: number) => {
    const index = history.current.findIndex((e) => e.id === id);
    if (index === -1) return;
    const [entry] = history.current.splice(index, 1);
    setHistorySize(history.current.length);
    entry.revert();
  }, []);

  /** Shows the change's toast and records it in the history. */
  const record = useCallback(
    (
      message: string,
      revert: () => void,
      variant?: ToastOptions["variant"],
    ) => {
      const id = nextEntryId.current++;
      const toastId = showToast({
        message,
        variant,
        action: { label: "Undo", onClick: () => undoEntry(id) },
      });
      history.current = [
        ...history.current,
        { id, message, revert, toastId },
      ].slice(-MAX_HISTORY);
      setHistorySize(history.current.length);
      return toastId;
    },
    [showToast, undoEntry],
  );

  /** Reverts the newest change still in the history; false if none. */
  const undoLast = useCallback(() => {
    const entry = history.current.pop();
    if (!entry) return false;
    setHistorySize(history.current.length);
    entry.revert();
    dismissToast(entry.toastId);
    showToast({ message: `Undone: ${entry.message}`, duration: 2000 });
    return true;
  }, [dismissToast, showToast]);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item]);
      if (lastAddToast.current !== null) dismissToast(lastAddToast.current);
      lastAddToast.current = record(
        `${one} added`,
        () => setItems((prev) => prev.filter((i) => i.id !== item.id)),
        "success",
      );
    },
    [setItems, dismissToast, record, one],
  );

  const remove = useCallback(
    (id: string) => {
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return;
      const item = items[index];
      setItems((prev) => prev.filter((i) => i.id !== id));
      record(`${one} removed`, () =>
        setItems((prev) => {
          if (prev.some((i) => i.id === id)) return prev;
          const at = Math.min(index, prev.length);
          return [...prev.slice(0, at), item, ...prev.slice(at)];
        }),
      );
    },
    [items, setItems, record, one],
  );

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    const snapshot = [...items];
    setItems([]);
    record(
      `Cleared ${snapshot.length} ${snapshot.length === 1 ? one.toLowerCase() : many}`,
      () =>
        setItems((prev) => {
          const restoredIds = new Set(snapshot.map((i) => i.id));
          return [...snapshot, ...prev.filter((i) => !restoredIds.has(i.id))];
        }),
    );
  }, [items, setItems, record, one, many]);

  const update = useCallback(
    (id: string, changes: Partial<T>, message = `${one} updated`) => {
      const previous = items.find((i) => i.id === id);
      if (!previous) return;
      // Undo restores only the changed fields, keeping later edits to others
      const reverted: Partial<T> = {};
      for (const key of Object.keys(changes) as (keyof T)[]) {
        reverted[key] = previous[key];
      }
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...changes } : i)),
      );
      record(
        message,
        () =>
          setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, ...reverted } : i)),
          ),
        "success",
      );
    },
    [items, setItems, record, one],
  );

  return {
    add,
    remove,
    clearAll,
    update,
    undoLast,
    canUndo: historySize > 0,
  };
}
