import { fireEvent, render, screen, within } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import {
  longPressDrag,
  mockRect,
  polyfillPointerEvent,
} from "../test/pointerEvents";
import { Action } from "../types/Action";
import TouchesView from "./TouchesView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

polyfillPointerEvent();

const ACTION: Action = {
  id: "a1",
  x: 30,
  y: 70,
  category: "defensive",
  actionType: "clearance",
  outcome: "unsuccessful",
  timestamp: 1,
};

let latestActions: Action[] = [];

const Harness: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([ACTION]);
  latestActions = actions;
  return (
    <ToastProvider>
      <TouchesView actions={actions} setActions={setActions} />
    </ToastProvider>
  );
};

const marker = () =>
  screen.getByRole("button", {
    name: "defensive - clearance (unsuccessful)",
  });
const checked = (group: string) =>
  within(screen.getByRole("radiogroup", { name: group }))
    .getAllByRole("radio")
    .find((r) => r.getAttribute("aria-checked") === "true")?.textContent;

describe("TouchesView marker editing", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?tab=touches");
    mockRect(100, 100);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("tapping a marker opens the edit form pre-filled", () => {
    render(<Harness />);
    fireEvent.click(marker());

    expect(screen.getByRole("dialog", { name: "Edit action" })).toBeTruthy();
    expect(checked("Action category")).toBe("Defensive");
    expect(checked("Action type")).toBe("Clearance");
    expect(checked("Outcome")).toBe("❌ Unsuccessful");
    expect(latestActions).toHaveLength(1);
  });

  it("Save updates the action in place", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByRole("radio", { name: "🧹 Cleared" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(latestActions).toEqual([{ ...ACTION, outcome: "cleared" }]);
  });

  it("Delete removes the action and Undo restores it", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(latestActions).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latestActions).toEqual([ACTION]);
  });

  it("long-press drag moves the action", () => {
    vi.useFakeTimers();
    render(<Harness />);
    longPressDrag(marker(), { clientX: 55, clientY: 45 });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(latestActions).toHaveLength(1);
    expect(latestActions[0].x).toBeCloseTo(55);
    expect(latestActions[0].y).toBeCloseTo(45);
    expect(screen.getByRole("status").textContent).toContain("Action moved");
  });
});
