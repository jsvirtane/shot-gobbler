import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { mockRect } from "../test/pointerEvents";
import { PassChain } from "../types/PassChain";
import { PitchZone } from "../utils/pitchZones";
import PassChainsView from "./PassChainsView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

const ZONE: PitchZone = { horizontal: "central", vertical: "midfield" };

const chain = (id: string, x: number): PassChain => ({
  id,
  actions: [
    { x, y: 20, sequenceNumber: 0, actionType: "start", pitchZone: ZONE },
    { x, y: 40, sequenceNumber: 1, actionType: "pass", pitchZone: ZONE },
  ],
  terminationReason: "tackled",
  isCompleted: true,
  zones: { start: ZONE, end: ZONE },
});

const CHAINS = [chain("c1", 20), chain("c2", 70)];

let latestChains: PassChain[] = [];

const Harness: React.FC = () => {
  const [chains, setChains] = useState<PassChain[]>(CHAINS);
  latestChains = chains;
  return (
    <ToastProvider>
      <PassChainsView passChains={chains} setPassChains={setChains} />
    </ToastProvider>
  );
};

const layers = () => screen.getAllByTestId("chain-layer");
const firstChainMarker = () =>
  layers()[0].querySelector<HTMLElement>(
    "[data-testid=chain-termination-marker]",
  )!;

describe("PassChainsView chain selection", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?tab=chains");
    mockRect(100, 100);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("tapping a chain marker selects it and dims the others", () => {
    render(<Harness />);
    expect(screen.queryByRole("toolbar")).toBeNull();

    fireEvent.click(firstChainMarker());

    expect(
      screen.getByRole("toolbar", { name: "Selected pass chain" }),
    ).toBeTruthy();
    const [first, second] = layers();
    expect(first.dataset.selected).toBe("true");
    expect(first.style.opacity).toBe("");
    expect(second.style.opacity).toBe("0.25");
    // No new chain was started
    expect(screen.queryByText("Undo Last Action")).toBeNull();
  });

  it("Close clears the selection", () => {
    render(<Harness />);
    fireEvent.click(firstChainMarker());
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(layers()[1].style.opacity).toBe("");
  });

  it("a tap on the pitch clears the selection without starting a chain", () => {
    render(<Harness />);
    fireEvent.click(firstChainMarker());
    fireEvent.click(document.getElementById("share-pitch")!, {
      clientX: 50,
      clientY: 90,
    });
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.queryByText("Undo Last Action")).toBeNull();
  });

  it("Delete chain removes it with Undo", () => {
    render(<Harness />);
    fireEvent.click(firstChainMarker());
    fireEvent.click(screen.getByRole("button", { name: "Delete chain" }));

    expect(latestChains.map((c) => c.id)).toEqual(["c2"]);
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Pass chain removed",
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latestChains.map((c) => c.id)).toEqual(["c1", "c2"]);
  });
});
