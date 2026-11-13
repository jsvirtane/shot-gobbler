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
  y: 20,
  isGoal: false,
  result: "Saved",
  bodyPart: "Head",
  shotType: "Set Piece",
  team: "away",
  playerName: "9",
  timestamp: 1,
};

const BOTTOM_SHOT: Shot = { ...SHOT, id: "s2", x: 30, y: 80, playerName: "" };

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
const checked = (group: string) =>
  within(screen.getByRole("radiogroup", { name: group }))
    .getAllByRole("radio")
    .find((r) => r.getAttribute("aria-checked") === "true")?.textContent;

describe("ShotsView marker editing", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    mockRect(100, 100);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("tapping a marker opens the edit form pre-filled, without adding a shot", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());

    expect(screen.getByRole("dialog", { name: "Edit shot" })).toBeTruthy();
    expect(checked("Team")).toBe("🚌 Away");
    expect(checked("Result")).toBe("🧤 Saved");
    expect(checked("Body part")).toBe("👤 Head");
    expect(checked("Shot type")).toBe("Set Piece");
    expect(
      (screen.getByPlaceholderText("e.g., Ronaldo or 7") as HTMLInputElement)
        .value,
    ).toBe("9");
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(latestShots).toHaveLength(1);
  });

  it("opens the full form even in quick entry mode", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(screen.getByRole("switch", { name: /Quick entry/ }));
    fireEvent.click(marker());
    expect(screen.getByRole("dialog", { name: "Edit shot" })).toBeTruthy();
  });

  it("Save updates the shot in place", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByRole("radio", { name: "⚽ Goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(latestShots).toHaveLength(1);
    expect(latestShots[0]).toMatchObject({
      id: "s1",
      timestamp: 1,
      x: 40,
      y: 20,
      result: "Goal",
      isGoal: true,
      team: "away",
    });
  });

  it("Cancel leaves the shot unchanged", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByRole("radio", { name: "⚽ Goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(latestShots).toEqual([SHOT]);
  });

  it("Delete removes the shot and Undo restores it", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(latestShots).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toContain("Shot removed");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latestShots).toEqual([SHOT]);
  });

  it("a new shot after editing gets a fresh form", () => {
    render(<Harness initial={[SHOT]} />);
    fireEvent.click(marker());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(document.getElementById("share-pitch")!, {
      clientX: 80,
      clientY: 80,
    });
    expect(screen.getByRole("dialog", { name: "New Shot" })).toBeTruthy();
    expect(checked("Result")).toBe("❌ Miss");
  });

  it("long-press drag moves the shot, with Undo", () => {
    vi.useFakeTimers();
    render(<Harness initial={[SHOT]} />);
    longPressDrag(marker(), { clientX: 70, clientY: 60 });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(latestShots).toHaveLength(1);
    expect(latestShots[0]).toMatchObject({ id: "s1", x: 70, y: 60 });
    expect(screen.getByRole("status").textContent).toContain("Shot moved");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latestShots[0]).toMatchObject({ x: 40, y: 20 });
  });

  it("moving a mirrored shot in half view keeps it where it was dropped", () => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/?tab=shots&pitch=half");
    render(<Harness initial={[BOTTOM_SHOT]} />);
    const m = marker(/Set Piece - Head - Saved$/);
    // Shown mirrored at (70, 20)
    expect(m.style.left).toBe("70%");
    expect(m.style.top).toBe("20%");

    // 100px of visible height covers y 0-50
    longPressDrag(m, { clientX: 25, clientY: 40 });

    expect(latestShots[0]).toMatchObject({ x: 75, y: 80 });
    const moved = marker(/Set Piece - Head - Saved$/);
    expect(moved.style.left).toBe("25%");
    expect(moved.style.top).toBe("20%");
  });
});
