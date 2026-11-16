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
const chainRing = () => screen.queryByRole("dialog", { name: "Pass chain" });

describe("PassChainsView chain selection", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?tab=chains");
    mockRect(100, 100);
  });

  afterEach(() => vi.restoreAllMocks());

  it("tapping a chain marker selects it, dims the others and opens its ring", () => {
    render(<Harness />);
    expect(chainRing()).toBeNull();

    fireEvent.click(firstChainMarker());

    expect(chainRing()).not.toBeNull();
    expect(screen.getByLabelText("Chain 1, 2 points")).toBeTruthy();
    const [first, second] = layers();
    expect(first.dataset.selected).toBe("true");
    expect(first.style.opacity).toBe("");
    expect(second.style.opacity).toBe("0.25");
    // No new chain was started
    expect(screen.queryByText(/Chain started/)).toBeNull();
  });

  it("closing the ring clears the selection without starting a chain", () => {
    render(<Harness />);
    fireEvent.click(firstChainMarker());
    fireEvent.click(screen.getByTestId("radial-backdrop"));
    expect(chainRing()).toBeNull();
    expect(layers()[1].style.opacity).toBe("");
    expect(screen.queryByText(/Chain started/)).toBeNull();

    fireEvent.click(firstChainMarker());
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(chainRing()).toBeNull();
    expect(layers()[1].style.opacity).toBe("");
  });

  it("Delete removes the chain with Undo", () => {
    render(<Harness />);
    fireEvent.click(firstChainMarker());
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(latestChains.map((c) => c.id)).toEqual(["c2"]);
    expect(chainRing()).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Pass chain removed",
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latestChains.map((c) => c.id)).toEqual(["c1", "c2"]);
  });
});
