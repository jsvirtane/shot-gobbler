import { Dispatch, SetStateAction, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";

type Nouns = {
  /** Capitalised singular, e.g. "Shot". */
  one: string;
  /** Lower-case plural, e.g. "shots". */
  many: string;
};

/**
 * Add, remove and clear-all for a list of items with ids, each showing a
 * toast with an Undo button. Undo uses functional updates keyed by id, so
 * it stays correct when other changes happened in between.
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

  const add = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item]);
      if (lastAddToast.current !== null) dismissToast(lastAddToast.current);
      lastAddToast.current = showToast({
        message: `${one} added`,
        variant: "success",
        action: {
          label: "Undo",
          onClick: () =>
            setItems((prev) => prev.filter((i) => i.id !== item.id)),
        },
      });
    },
    [setItems, showToast, dismissToast, one],
  );

  const remove = useCallback(
    (id: string) => {
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return;
      const item = items[index];
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast({
        message: `${one} removed`,
        action: {
          label: "Undo",
          onClick: () =>
            setItems((prev) => {
              if (prev.some((i) => i.id === id)) return prev;
              const at = Math.min(index, prev.length);
              return [...prev.slice(0, at), item, ...prev.slice(at)];
            }),
        },
      });
    },
    [items, setItems, showToast, one],
  );

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    const snapshot = [...items];
    setItems([]);
    showToast({
      message: `Cleared ${snapshot.length} ${snapshot.length === 1 ? one.toLowerCase() : many}`,
      action: {
        label: "Undo",
        onClick: () =>
          setItems((prev) => {
            const restoredIds = new Set(snapshot.map((i) => i.id));
            return [...snapshot, ...prev.filter((i) => !restoredIds.has(i.id))];
          }),
      },
    });
  }, [items, setItems, showToast, one, many]);

  return { add, remove, clearAll };
}
