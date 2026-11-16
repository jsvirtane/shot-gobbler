import { act, fireEvent, renderHook, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HAPTICS_STORAGE_KEY } from "../utils/feedback";
import { ToastProvider } from "../components/Toast";
import { useUndoableList } from "./useUndoableList";

type Item = { id: string; name: string };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

const setup = (initial: Item[] = []) =>
  renderHook(
    () => {
      const [items, setItems] = useState(initial);
      const list = useUndoableList(items, setItems, {
        one: "Item",
        many: "items",
      });
      return { items, ...list };
    },
    { wrapper },
  );

const names = (items: Item[]) => items.map((i) => i.name);

describe("useUndoableList history", () => {
  it("undoes changes one by one, newest first", () => {
    const { result } = setup([{ id: "a", name: "A" }]);
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.add({ id: "b", name: "B" }));
    act(() => result.current.update("a", { name: "A2" }));
    act(() => result.current.remove("b"));
    expect(names(result.current.items)).toEqual(["A2"]);
    expect(result.current.canUndo).toBe(true);

    act(() => void result.current.undoLast());
    expect(names(result.current.items)).toEqual(["A2", "B"]);
    act(() => void result.current.undoLast());
    expect(names(result.current.items)).toEqual(["A", "B"]);
    act(() => void result.current.undoLast());
    expect(names(result.current.items)).toEqual(["A"]);
    expect(result.current.canUndo).toBe(false);

    let undone = true;
    act(() => {
      undone = result.current.undoLast();
    });
    expect(undone).toBe(false);
  });

  it("takes a change out of the history when its toast's Undo is used", () => {
    const { result } = setup();
    act(() => result.current.add({ id: "a", name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(result.current.items).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it("confirms an undo from the history with a toast", () => {
    const { result } = setup();
    act(() => result.current.add({ id: "a", name: "A" }));
    act(() => void result.current.undoLast());
    expect(screen.getByText("Undone: Item added")).toBeTruthy();
    // The change's own toast is gone, so its Undo can't be used twice
    expect(screen.queryByText("Item added")).toBeNull();
  });
});

describe("useUndoableList feedback", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockVibrate = () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
    });
    return vibrate;
  };

  it("vibrates on add, update and remove, unless switched off", () => {
    const vibrate = mockVibrate();
    const { result } = setup([{ id: "a", name: "A" }]);

    act(() => result.current.add({ id: "b", name: "B" }));
    act(() => result.current.update("a", { name: "A2" }));
    act(() => result.current.remove("b"));
    expect(vibrate).toHaveBeenCalledTimes(3);
    expect(vibrate).toHaveBeenCalledWith(12);

    localStorage.setItem(HAPTICS_STORAGE_KEY, "0");
    act(() => result.current.add({ id: "c", name: "C" }));
    expect(vibrate).toHaveBeenCalledTimes(3);
  });

  it("keeps working when vibration throws", () => {
    const vibrate = mockVibrate();
    vibrate.mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = setup();
    act(() => result.current.add({ id: "a", name: "A" }));
    expect(names(result.current.items)).toEqual(["A"]);
  });

  it("names the item added or updated last, with a new key each time", () => {
    const { result } = setup([{ id: "a", name: "A" }]);
    expect(result.current.pulse).toBeNull();

    act(() => result.current.add({ id: "b", name: "B" }));
    const first = result.current.pulse;
    expect(first?.id).toBe("b");

    act(() => result.current.update("a", { name: "A2" }));
    expect(result.current.pulse?.id).toBe("a");
    act(() => result.current.update("a", { name: "A3" }));
    expect(result.current.pulse?.key).not.toBe(first?.key);
  });

  it("shows a summary in the toast, with Undo still in the history", () => {
    const { result } = setup();
    act(() =>
      result.current.add(
        { id: "a", name: "A" },
        { lead: "Miss", message: "ARS · Head", dot: "#000" },
      ),
    );
    const toast = screen.getByRole("status");
    expect(toast.textContent).toContain("Miss · ARS · Head");
    expect(toast.textContent).toContain("Item added");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(result.current.items).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });
});
