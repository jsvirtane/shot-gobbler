import { act, fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TrackerControls,
  TrackerControlsContext,
} from "../components/FocusMode/trackerControls";
import { ToastProvider } from "../components/Toast";
import { ACTION_OUTCOMES, ACTION_TYPES } from "../constants/actionTypes";
import { mockRect } from "../test/pointerEvents";
import { Action } from "../types/Action";
import { EventStamp } from "../types/Match";
import TouchesView from "./TouchesView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

const STAMP: EventStamp = { matchId: "m1", minute: 23, period: "1H" };

let latestActions: Action[] = [];
let controls: TrackerControls | null = null;

const Harness: React.FC<{ focus?: boolean }> = ({ focus }) => {
  const [actions, setActions] = useState<Action[]>([]);
  latestActions = actions;
  return (
    <TrackerControlsContext.Provider value={(c) => (controls = c)}>
      <ToastProvider>
        <TouchesView
          actions={actions}
          setActions={setActions}
          getEventStamp={() => STAMP}
          focus={focus}
        />
      </ToastProvider>
    </TrackerControlsContext.Provider>
  );
};

const tapPitch = (x = 40, y = 60) =>
  fireEvent.click(screen.getByTestId("pitch"), { clientX: x, clientY: y });
const option = (name: string) => screen.getByRole("button", { name });
const ring = () => screen.queryByRole("dialog")?.getAttribute("aria-label");

describe("TouchesView radial entry", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?tab=touches");
    mockRect(100, 100);
    latestActions = [];
    controls = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records a pass in two taps, stamped with match, minute and period", () => {
    render(<Harness />);
    tapPitch();

    expect(ring()).toBe("Record action");
    expect(screen.getByText("ACTION")).toBeTruthy();
    fireEvent.click(option("Pass"));
    expect(ring()).toBe("Action outcome");
    expect(screen.getByText("PASS")).toBeTruthy();
    fireEvent.click(option("Key Pass"));

    expect(ring()).toBeUndefined();
    expect(latestActions).toHaveLength(1);
    expect(latestActions[0]).toMatchObject({
      x: 40,
      y: 60,
      category: "attacking",
      actionType: "pass",
      outcome: "key-pass",
      ...STAMP,
    });
  });

  it("shows the main actions in Attack, Defend and Duel sections", () => {
    render(<Harness />);
    tapPitch();
    for (const name of [
      "Pass",
      "Cross",
      "Dribble",
      "Tackle",
      "Interception",
      "Clearance",
      "Aerial Duel",
      "Ground Duel",
      "More actions",
    ]) {
      expect(option(name)).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Shot" })).toBeNull();
    expect(screen.getByText("ATTACK")).toBeTruthy();
    expect(screen.getByText("DEFEND")).toBeTruthy();
    expect(screen.getByText("DUEL")).toBeTruthy();
  });

  it("More opens the other actions and Back returns", () => {
    render(<Harness />);
    tapPitch();
    fireEvent.click(option("More actions"));

    for (const name of ["Shot", "Throw-in", "Block", "Other"]) {
      expect(option(name)).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Pass" })).toBeNull();

    fireEvent.click(option("Back"));
    expect(option("Pass")).toBeTruthy();

    // Back from the outcome ring goes to the action ring too
    fireEvent.click(option("Tackle"));
    fireEvent.click(option("Back"));
    expect(option("Pass")).toBeTruthy();
    expect(latestActions).toHaveLength(0);
  });

  it("closing the ring saves nothing", () => {
    render(<Harness />);
    tapPitch();
    fireEvent.click(option("Pass"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(ring()).toBeUndefined();

    tapPitch();
    fireEvent.click(screen.getByTestId("radial-backdrop"));
    expect(ring()).toBeUndefined();
    expect(latestActions).toHaveLength(0);
  });

  it("can record every action type and outcome", () => {
    render(<Harness />);
    let expected = 0;
    for (const type of ACTION_TYPES) {
      for (const outcome of ACTION_OUTCOMES[type.value]) {
        tapPitch();
        if (!screen.queryByRole("button", { name: type.label })) {
          fireEvent.click(option("More actions"));
        }
        fireEvent.click(option(type.label));
        fireEvent.click(option(outcome.label));
        expected++;
        expect(latestActions).toHaveLength(expected);
        expect(latestActions[latestActions.length - 1]).toMatchObject({
          category: type.category,
          actionType: type.value,
          outcome: outcome.value,
        });
      }
    }
  });

  it("registers undo with the focus bar", () => {
    render(<Harness focus />);
    expect(controls?.canUndo).toBe(false);

    tapPitch();
    fireEvent.click(option("Tackle"));
    fireEvent.click(option("Won"));
    expect(latestActions).toHaveLength(1);
    expect(controls?.canUndo).toBe(true);

    act(() => controls?.undo());
    expect(latestActions).toHaveLength(0);
  });
});
