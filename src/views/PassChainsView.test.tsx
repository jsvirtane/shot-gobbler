import { act, fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TrackerControls,
  TrackerControlsContext,
} from "../components/FocusMode/trackerControls";
import { ToastProvider } from "../components/Toast";
import { mockRect } from "../test/pointerEvents";
import { EventStamp } from "../types/Match";
import { PassChain } from "../types/PassChain";
import { getChainStats } from "../utils/stats/chains";
import PassChainsView from "./PassChainsView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

let latestChains: PassChain[] = [];
let controls: TrackerControls | null = null;

const Harness: React.FC<{
  initial?: PassChain[];
  focus?: boolean;
  getEventStamp?: () => EventStamp;
}> = ({ initial = [], focus = false, getEventStamp }) => {
  const [chains, setChains] = useState<PassChain[]>(initial);
  latestChains = chains;
  return (
    <ToastProvider>
      <TrackerControlsContext.Provider value={(c) => (controls = c)}>
        <PassChainsView
          passChains={chains}
          setPassChains={setChains}
          focus={focus}
          getEventStamp={getEventStamp}
        />
      </TrackerControlsContext.Provider>
    </ToastProvider>
  );
};

/** Taps the pitch at full-pitch % (the pitch is mocked as 100 × 100 px). */
const tapPitch = (x: number, y: number) =>
  fireEvent.click(document.getElementById("share-pitch")!, {
    clientX: x,
    clientY: y,
  });

const ring = () => screen.queryByTestId("radial-menu");
const pick = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
/**
 * Points of the chain being recorded (with no saved chains on the pitch):
 * it draws one marker per point plus a placeholder at the last point.
 */
const points = () =>
  Math.max(
    0,
    document.querySelectorAll("[data-testid=chain-action-marker]").length - 1,
  );
const status = () =>
  screen
    .getAllByRole("status")
    .map((s) => s.textContent)
    .join(" ");

/** Start at (50, 90), then pass, carry and shot, ending as saved. */
const recordChain = () => {
  tapPitch(50, 90);
  tapPitch(55, 65);
  pick("Pass");
  tapPitch(45, 40);
  pick("Carry");
  tapPitch(40, 15);
  pick("Shot");
  tapPitch(40, 15);
  pick("End chain");
  pick("Shot saved");
};

describe("PassChainsView radial entry", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?tab=pass-chains");
    mockRect(100, 100);
    latestChains = [];
    controls = null;
  });

  afterEach(() => vi.restoreAllMocks());

  it("the first tap starts a chain without a ring", () => {
    render(<Harness />);
    tapPitch(50, 90);

    expect(ring()).toBeNull();
    expect(points()).toBe(1);
    expect(status()).toContain("Chain started · tap where the ball goes");
    expect(latestChains).toHaveLength(0);
  });

  it("the next tap opens the Step ring with the last-used step outlined", () => {
    render(<Harness />);
    tapPitch(50, 90);
    tapPitch(55, 65);

    expect(ring()).not.toBeNull();
    for (const name of ["Pass", "Carry", "Cross", "Shot", "End chain"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(
      screen.getByRole("button", { name: "Pass" }).getAttribute("aria-current"),
    ).toBe("true");

    pick("Carry");
    expect(ring()).toBeNull();
    expect(points()).toBe(2);

    tapPitch(45, 40);
    expect(
      screen
        .getByRole("button", { name: "Carry" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Pass" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("records a full chain and saves it from the End ring", () => {
    render(<Harness getEventStamp={() => ({ matchId: "m1", minute: 12 })} />);
    recordChain();

    expect(ring()).toBeNull();
    expect(latestChains).toHaveLength(1);
    const [saved] = latestChains;
    expect(saved.matchId).toBe("m1");
    expect(saved.minute).toBe(12);
    expect(saved.terminationReason).toBe("shot_saved");
    expect(saved.actions.map((a) => a.actionType)).toEqual([
      "start",
      "pass",
      "carry",
      "shot",
    ]);
    expect(saved.actions.map((a) => a.sequenceNumber)).toEqual([0, 1, 2, 3]);
    expect(saved.actions[0]).toMatchObject({ x: 50, y: 90 });
    // End chain added no point
    expect(saved.actions[3]).toMatchObject({ x: 40, y: 15 });
    // Zones and stats still compute
    expect(saved.zones).toEqual({
      start: saved.actions[0].pitchZone,
      end: saved.actions[3].pitchZone,
    });
    expect(saved.actions[0].pitchZone.vertical).toBe("defensive");
    expect(saved.actions[3].pitchZone.vertical).toBe("attacking");
    const stats = getChainStats(latestChains);
    expect(stats.count).toBe(1);
    expect(stats.endedInShot).toBe(1);
    expect(stats.reachedAttackingThird).toBe(1);
    expect(stats.zoneToZone.defensive.attacking).toBe(1);
    expect(status()).toContain("Pass chain added");
  });

  it("the End ring offers every termination reason, grouped", () => {
    render(<Harness />);
    tapPitch(50, 90);
    tapPitch(55, 65);
    pick("End chain");

    expect(screen.getByRole("dialog", { name: "End chain" })).toBeTruthy();
    const labels = screen
      .getAllByTestId("radial-section-label")
      .map((l) => l.textContent);
    expect(labels).toEqual(["SHOT", "LOST", "STOPPED"]);
    const ids = Array.from(document.querySelectorAll("[data-item-id]"), (el) =>
      el.getAttribute("data-item-id"),
    );
    expect(ids).toEqual([
      "goal",
      "shot_saved",
      "shot_missed",
      "shot_blocked",
      "tackled",
      "intercepted",
      "clearance",
      "bad_pass",
      "out_of_bounds",
      "fouled",
      "offside",
      "manual_end",
    ]);
  });

  it("cancelling a ring adds nothing", () => {
    render(<Harness />);
    tapPitch(50, 90);
    tapPitch(55, 65);
    fireEvent.click(screen.getByTestId("radial-backdrop"));
    expect(ring()).toBeNull();
    expect(points()).toBe(1);

    // Cancelling the End ring keeps the chain going
    tapPitch(55, 65);
    pick("End chain");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(ring()).toBeNull();
    expect(latestChains).toHaveLength(0);
    expect(points()).toBe(1);
  });

  it.each([false, true])(
    "Cancel chain drops the chain being recorded (focus %s), Undo restores it",
    (focus) => {
      render(<Harness focus={focus} />);
      tapPitch(50, 90);
      tapPitch(55, 65);
      pick("Pass");
      tapPitch(45, 40);
      pick("Cancel chain");

      expect(ring()).toBeNull();
      expect(points()).toBe(0);
      expect(latestChains).toHaveLength(0);
      expect(status()).toContain("Chain cancelled");

      pick("Undo");
      expect(points()).toBe(2);
      // The next tap starts no new chain: it continues the restored one
      tapPitch(45, 40);
      pick("End chain");
      pick("Goal");
      expect(latestChains[0].actions).toHaveLength(2);
    },
  );

  it("undo removes the last point, then reopens the last saved chain", () => {
    render(<Harness focus />);
    recordChain();
    expect(latestChains).toHaveLength(1);
    expect(controls?.canUndo).toBe(true);

    // Reopens the saved chain with all its points
    act(() => controls!.undo());
    expect(latestChains).toHaveLength(0);
    expect(points()).toBe(4);

    // Then takes points back one by one
    act(() => controls!.undo());
    expect(points()).toBe(3);

    // And the chain can be ended again
    tapPitch(30, 10);
    pick("End chain");
    pick("Goal");
    expect(latestChains).toHaveLength(1);
    expect(latestChains[0].actions).toHaveLength(3);
    expect(latestChains[0].terminationReason).toBe("goal");
  });

  it("undo mid-chain removes only the last point", () => {
    render(<Harness focus />);
    tapPitch(50, 90);
    tapPitch(55, 65);
    pick("Pass");
    tapPitch(45, 40);
    pick("Cross");
    expect(points()).toBe(3);

    act(() => controls!.undo());
    expect(points()).toBe(2);

    tapPitch(45, 40);
    pick("Pass");
    tapPitch(45, 30);
    pick("End chain");
    pick("Tackled");
    expect(latestChains[0].actions.map((a) => a.sequenceNumber)).toEqual([
      0, 1, 2,
    ]);
  });

  it("works the same in focus mode, with no picker row above the pitch", () => {
    render(<Harness focus />);
    tapPitch(50, 90);
    expect(
      screen.queryByRole("group", { name: "Next action type" }),
    ).toBeNull();
    expect(screen.queryByText("Undo Last Action")).toBeNull();
    tapPitch(55, 65);
    pick("Pass");
    tapPitch(55, 40);
    pick("End chain");
    pick("Out of bounds");
    expect(latestChains[0].terminationReason).toBe("out_of_bounds");
  });

  it("keeps the view toggle while recording, and the chain survives a switch", () => {
    render(<Harness />);
    tapPitch(50, 90);
    expect(screen.getByRole("radio", { name: /List View/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: /List View/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Pitch View/ }));
    expect(points()).toBe(1);
  });

  it("list view removes and clears saved chains", () => {
    render(<Harness />);
    recordChain();
    recordChain();
    fireEvent.click(screen.getByRole("radio", { name: /List View/ }));
    fireEvent.click(screen.getAllByTitle("Remove this pass chain")[0]);
    expect(latestChains).toHaveLength(1);
    fireEvent.click(screen.getByTestId("clear-all"));
    expect(latestChains).toHaveLength(0);
  });
});
