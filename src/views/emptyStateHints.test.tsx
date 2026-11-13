import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { mockRect } from "../test/pointerEvents";
import { Action } from "../types/Action";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import PassChainsView from "./PassChainsView";
import ShotsView from "./ShotsView";
import TouchesView from "./TouchesView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

const SHOT: Shot = {
  id: "s1",
  x: 40,
  y: 20,
  isGoal: false,
  result: "Saved",
  bodyPart: "Head",
  shotType: "Set Piece",
  team: "home",
  playerName: "9",
  timestamp: 1,
};

const ACTION: Action = {
  id: "a1",
  x: 30,
  y: 70,
  category: "attacking",
  actionType: "pass",
  outcome: "successful",
  timestamp: 1,
};

const ZONE = { horizontal: "central", vertical: "midfield" } as const;
const CHAIN: PassChain = {
  id: "c1",
  actions: [
    { x: 20, y: 20, sequenceNumber: 0, actionType: "start", pitchZone: ZONE },
    { x: 20, y: 40, sequenceNumber: 1, actionType: "pass", pitchZone: ZONE },
  ],
  terminationReason: "tackled",
  isCompleted: true,
  zones: { start: ZONE, end: ZONE },
};

const hint = () => screen.queryByTestId("pitch-hint");

const expectOverlayHint = (text: string) => {
  const overlay = hint();
  expect(overlay).not.toBeNull();
  expect(overlay!.textContent).toContain(text);
  // Taps go through to the pitch and the hint stays out of shared images
  expect(overlay!.className).toContain("pointer-events-none");
  expect(overlay!.getAttribute("data-html2canvas-ignore")).toBe("true");
  // Drawn on the pitch itself
  expect(overlay!.closest("[data-testid=pitch]")).not.toBeNull();
};

describe("empty-state pitch hints", () => {
  beforeEach(() => {
    mockRect(100, 100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a shots hint on an empty pitch and hides it once there are shots", () => {
    window.history.replaceState({}, "", "/?tab=shots");
    const { rerender } = render(
      <ToastProvider>
        <ShotsView shots={[]} setShots={vi.fn()} />
      </ToastProvider>,
    );
    expectOverlayHint("Tap where the shot was taken");

    rerender(
      <ToastProvider>
        <ShotsView shots={[SHOT]} setShots={vi.fn()} />
      </ToastProvider>,
    );
    expect(hint()).toBeNull();
  });

  it("shows a touches hint on the pitch instead of the old paragraph", () => {
    window.history.replaceState({}, "", "/?tab=touches");
    const { rerender } = render(
      <ToastProvider>
        <TouchesView actions={[]} setActions={vi.fn()} />
      </ToastProvider>,
    );
    expectOverlayHint("Tap where the player made an action");
    expect(screen.queryByText(/record player's actions/)).toBeNull();

    rerender(
      <ToastProvider>
        <TouchesView actions={[ACTION]} setActions={vi.fn()} />
      </ToastProvider>,
    );
    expect(hint()).toBeNull();
  });

  it("shows the pass chain hint on the pitch until a chain exists", () => {
    window.history.replaceState({}, "", "/?tab=pass-chains");
    const { rerender } = render(
      <ToastProvider>
        <PassChainsView passChains={[]} setPassChains={vi.fn()} />
      </ToastProvider>,
    );
    expectOverlayHint("Click on the pitch to start a new pass chain.");

    rerender(
      <ToastProvider>
        <PassChainsView passChains={[CHAIN]} setPassChains={vi.fn()} />
      </ToastProvider>,
    );
    expect(hint()).toBeNull();
  });
});
