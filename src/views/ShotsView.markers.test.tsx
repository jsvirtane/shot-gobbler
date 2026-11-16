import { fireEvent, render, screen, within } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import {
  longPressDrag,
  mockRect,
  polyfillPointerEvent,
} from "../test/pointerEvents";
import { Shot } from "../types/Shot";
import ShotsView from "./ShotsView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

polyfillPointerEvent();

const SHOT: Shot = {
  id: "s1",
  x: 40,
  y: 70,
  isGoal: false,
  result: "Saved",
  bodyPart: "Head",
  shotType: "Set Piece",
  team: "away",
  playerName: "9",
  timestamp: 1,
  matchId: "m1",
  minute: 67,
  period: "2H",
};

let latestShots: Shot[] = [];

const Harness: React.FC<{ initial: Shot[] }> = ({ initial }) => {
  const [shots, setShots] = useState<Shot[]>(initial);
  latestShots = shots;
  return (
    <ToastProvider>
      <ShotsView shots={shots} setShots={setShots} />
    </ToastProvider>
  );
};

const marker = (name: RegExp = /Set Piece - Head - Saved - 9/) =>
  screen.getByRole("button", { name });
const ring = () => screen.getByTestId("radial-menu");
const option = (name: string) => within(ring()).getByRole("button", { name });
const pick = (name: string) => fireEvent.click(option(name));
const tapPitch = (x: number, y: number) =>
  fireEvent.click(document.getElementById("share-pitch")!, {
    clientX: x,
    clientY: y,
  });
const undo = () =>
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));

describe("ShotsView marker editing", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    latestShots = [];
    mockRect(100, 100);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("tapping a marker opens the ring with its values, without adding a shot", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());

    expect(screen.getByRole("dialog", { name: "Edit shot" })).toBeTruthy();
    expect(option("Saved").getAttribute("aria-current")).toBe("true");
    expect(option("Goal").getAttribute("aria-current")).toBeNull();
    expect(option("Header").getAttribute("aria-pressed")).toBe("true");
    expect(option("Set piece").getAttribute("aria-pressed")).toBe("true");
    expect(option("Penalty").getAttribute("aria-pressed")).toBe("false");
    expect(option("Shirt number 9")).toBeTruthy();
    expect(option("Minute 67")).toBeTruthy();
    expect(option("Move")).toBeTruthy();
    expect(option("Delete")).toBeTruthy();
    expect(
      screen.getByTestId("radial-center").getAttribute("aria-label"),
    ).toContain("Away");
    expect(latestShots).toEqual([SHOT]);
  });

  it("a result saves the changes in place, keeping id, match, minute and period", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Header");
    pick("Goal");

    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toHaveLength(1);
    expect(latestShots[0]).toEqual({
      ...SHOT,
      result: "Goal",
      isGoal: true,
      bodyPart: "Foot",
    });
    expect(screen.getByRole("status").textContent).toContain("Shot updated");

    undo();
    expect(latestShots).toEqual([SHOT]);
  });

  it("closing the ring leaves the shot unchanged", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Header");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toEqual([SHOT]);
  });

  it("switching the team of a shot mirrors it into the other attacking half", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByTestId("radial-center"));
    pick("Saved");
    expect(latestShots[0]).toMatchObject({ team: "home", x: 60, y: 30 });

    undo();
    expect(latestShots).toEqual([SHOT]);
  });

  it("changes the shirt number on the dial", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Shirt number 9");
    pick("Delete digit");
    pick("1");
    pick("1");
    pick("Done");
    pick("Saved");
    expect(latestShots[0]).toMatchObject({ playerName: "11" });

    undo();
    expect(latestShots[0].playerName).toBe("9");
  });

  it("changes the minute on the dial, keeping the period", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Minute 67");
    expect(screen.getByRole("dialog", { name: "Minute" })).toBeTruthy();
    pick("Delete digit");
    pick("Delete digit");
    pick("7");
    pick("2");
    pick("Done");
    expect(option("Minute 72")).toBeTruthy();
    pick("Saved");
    expect(latestShots[0]).toMatchObject({ minute: 72, period: "2H" });

    undo();
    expect(latestShots[0].minute).toBe(67);
  });

  it("the minute dial's centre clears the minute", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Minute 67");
    fireEvent.click(screen.getByRole("button", { name: "Clear minute" }));
    pick("Saved");
    expect(latestShots[0].minute).toBeUndefined();
  });

  it("Move: the next pitch tap moves the shot, with Undo", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Move");
    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(screen.getByTestId("pitch-hint").textContent).toContain(
      "Tap the new spot",
    );

    tapPitch(30, 80);
    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toHaveLength(1);
    expect(latestShots[0]).toMatchObject({ id: "s1", x: 30, y: 80 });
    expect(screen.getByRole("status").textContent).toContain("Shot moved");

    // The next tap records a new shot again
    tapPitch(50, 60);
    expect(screen.getByRole("dialog", { name: "New shot" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });

    undo();
    expect(latestShots[0]).toMatchObject({ x: 40, y: 70 });
  });

  it("Move to the other half keeps the team and its attacking coordinates", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Move");
    tapPitch(30, 20);
    expect(latestShots[0]).toMatchObject({ team: "away", x: 70, y: 80 });
  });

  it("Delete removes the shot and Undo restores it", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    pick("Delete");

    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toContain("Shot removed");

    undo();
    expect(latestShots).toEqual([SHOT]);
  });

  it("a new shot after editing starts fresh", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    fireEvent.keyDown(document, { key: "Escape" });

    tapPitch(80, 80);
    expect(screen.getByRole("dialog", { name: "New shot" })).toBeTruthy();
    expect(option("Header").getAttribute("aria-pressed")).toBe("false");
    expect(within(ring()).queryByRole("button", { name: "Delete" })).toBeNull();
    expect(
      within(ring())
        .getAllByRole("button")
        .some((b) => b.getAttribute("aria-current") === "true"),
    ).toBe(false);
  });

  it("long-press drag moves the shot, with Undo", () => {
    vi.useFakeTimers();
    render(<Harness initial={[SHOT]} />);
    longPressDrag(marker(), { clientX: 70, clientY: 60 });

    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toHaveLength(1);
    expect(latestShots[0]).toMatchObject({ id: "s1", x: 70, y: 60 });
    expect(screen.getByRole("status").textContent).toContain("Shot moved");

    undo();
    expect(latestShots[0]).toMatchObject({ x: 40, y: 70 });
  });

  it("moving a mirrored shot in half view keeps it where it was dropped", () => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/?tab=shots&pitch=half");
    const top: Shot = {
      ...SHOT,
      team: "home",
      x: 30,
      y: 20,
      playerName: undefined,
    };
    render(<Harness initial={[top]} />);
    const m = marker(/Set Piece - Head - Saved$/);
    // Shown mirrored at (70, 80), attacking the goal at the bottom
    expect(m.style.left).toBe("70%");
    expect(m.style.top).toBe("80%");

    // 100px of visible height covers y 50-100
    longPressDrag(m, { clientX: 25, clientY: 40 });

    expect(latestShots[0]).toMatchObject({ x: 75, y: 30 });
    const moved = marker(/Set Piece - Head - Saved$/);
    expect(moved.style.left).toBe("25%");
    expect(moved.style.top).toBe("70%");
  });
});
