import { act, fireEvent, renderHook, screen } from "@testing-library/react";
import React, { useState } from "react";
import { describe, expect, it } from "vitest";
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
