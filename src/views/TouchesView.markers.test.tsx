import { fireEvent, render, screen } from "@testing-library/react";
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
  matchId: "m1",
  minute: 12,
  period: "1H",
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
    name: /^defensive - clearance/,
  });
const option = (name: string) => screen.getByRole("button", { name });
const isCurrent = (name: string) =>
  option(name).getAttribute("aria-current") === "true";

describe("TouchesView marker editing", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?tab=touches");
    mockRect(100, 100);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("tapping a marker opens the edit ring with the current values outlined", () => {
    render(<Harness />);
    fireEvent.click(marker());

    expect(screen.getByRole("dialog", { name: "Edit action" })).toBeTruthy();
    expect(isCurrent("Clearance")).toBe(true);
    expect(isCurrent("Pass")).toBe(false);
    expect(option("Move")).toBeTruthy();
    expect(option("Minute 12")).toBeTruthy();
    expect(option("Delete")).toBeTruthy();

    fireEvent.click(option("Clearance"));
    expect(isCurrent("Unsuccessful")).toBe(true);
    expect(isCurrent("Cleared")).toBe(false);
    expect(latestActions).toEqual([ACTION]);
  });

  it("picking an outcome updates the action in place", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Clearance"));
    fireEvent.click(option("Cleared"));

    expect(latestActions).toEqual([{ ...ACTION, outcome: "cleared" }]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("can change to an action under More, with its category", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("More actions"));
    fireEvent.click(option("Shot"));
    fireEvent.click(option("Goal"));

    expect(latestActions).toEqual([
      { ...ACTION, category: "attacking", actionType: "shot", outcome: "goal" },
    ]);
  });

  it("Move places the action at the next pitch tap", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Move"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("pitch-hint").textContent).toMatch(/new spot/);

    fireEvent.click(screen.getByTestId("pitch"), { clientX: 60, clientY: 20 });
    expect(latestActions).toEqual([{ ...ACTION, x: 60, y: 20 }]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("pitch-hint")).toBeNull();
  });

  it("Esc cancels a pending move", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Move"));
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByTestId("pitch"), { clientX: 60, clientY: 20 });
    expect(latestActions[0].x).toBe(30);
    // The tap opened the ring for a new action instead
    expect(screen.getByRole("dialog", { name: "Record action" })).toBeTruthy();
  });

  it("Minute opens a dial that sets the minute", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Minute 12"));

    expect(screen.getByRole("dialog", { name: "Minute" })).toBeTruthy();
    fireEvent.click(option("Delete digit"));
    fireEvent.click(option("Delete digit"));
    fireEvent.click(option("7"));
    fireEvent.click(option("4"));
    fireEvent.click(option("Done"));

    expect(latestActions).toEqual([{ ...ACTION, minute: 74 }]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Back on the minute dial returns to the edit ring unchanged", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Minute 12"));
    fireEvent.click(option("7"));
    fireEvent.click(option("Back"));

    expect(screen.getByRole("dialog", { name: "Edit action" })).toBeTruthy();
    expect(latestActions).toEqual([ACTION]);
  });

  it("keeps More among the actions, away from the Edit section", () => {
    render(<Harness />);
    fireEvent.click(marker());
    const before = (a: string, b: string) =>
      Boolean(
        option(a).compareDocumentPosition(option(b)) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    // Ring order: Attack, Defend, More, Duel, Edit
    expect(before("Interception", "More actions")).toBe(true);
    expect(before("More actions", "Ground Duel")).toBe(true);
    expect(before("Ground Duel", "Move")).toBe(true);
  });

  it("the minute dial's centre clears the minute", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Minute 12"));
    fireEvent.click(option("Clear the minute"));
    fireEvent.click(option("Done"));

    expect(latestActions[0].minute).toBeUndefined();
  });

  it("Delete removes the action and Undo restores it", () => {
    render(<Harness />);
    fireEvent.click(marker());
    fireEvent.click(option("Delete"));
    expect(latestActions).toHaveLength(0);
    expect(screen.queryByRole("dialog")).toBeNull();

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
