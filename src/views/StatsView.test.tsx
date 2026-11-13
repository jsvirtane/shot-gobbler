import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { Action } from "../types/Action";
import { PassChain } from "../types/PassChain";
import { Shot } from "../types/Shot";
import { getZonesFromPassChain } from "../utils/pitchZones";
import PassChainsView from "./PassChainsView";
import ShotsView from "./ShotsView";
import TouchesView from "./TouchesView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

const shot = (
  id: string,
  team: Shot["team"],
  result: Shot["result"],
): Shot => ({
  id,
  x: 50,
  y: 11,
  team,
  result,
  isGoal: result === "Goal",
  bodyPart: "Foot",
  shotType: "Penalty",
  timestamp: 0,
});

const SHOTS: Shot[] = [
  shot("1", "home", "Goal"),
  shot("2", "home", "Saved"),
  shot("3", "home", "Miss"),
  shot("4", "away", "Blocked"),
];

const ACTIONS: Action[] = [
  {
    id: "a1",
    x: 10,
    y: 10,
    category: "attacking",
    actionType: "pass",
    outcome: "successful",
    timestamp: 0,
  },
  {
    id: "a2",
    x: 50,
    y: 50,
    category: "attacking",
    actionType: "pass",
    outcome: "unsuccessful",
    timestamp: 0,
  },
  {
    id: "a3",
    x: 90,
    y: 90,
    category: "defensive",
    actionType: "tackle",
    outcome: "won",
    timestamp: 0,
  },
];

const chainActions: PassChain["actions"] = [
  {
    x: 50,
    y: 80,
    sequenceNumber: 0,
    actionType: "start",
    pitchZone: { horizontal: "central", vertical: "defensive" },
  },
  {
    x: 50,
    y: 20,
    sequenceNumber: 1,
    actionType: "pass",
    pitchZone: { horizontal: "central", vertical: "attacking" },
  },
];
const CHAINS: PassChain[] = [
  {
    id: "c1",
    actions: chainActions,
    terminationReason: "shot_saved",
    isCompleted: true,
    zones: getZonesFromPassChain(chainActions),
  },
];

const setView = (view: string, extra = "") =>
  window.history.replaceState({}, "", `/?view=${view}${extra}`);

const summaryText = () => screen.getByTestId("stats-summary").textContent;

describe("Stats view", () => {
  beforeEach(() => setView("stats"));

  it("shows shot stats per team with a summary line", () => {
    render(
      <ToastProvider>
        <ShotsView
          shots={SHOTS}
          setShots={vi.fn()}
          teamNames={{ home: "Arsenal", away: "Chelsea" }}
        />
      </ToastProvider>,
    );
    expect(
      screen.getByRole("radio", { name: /Stats/ }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(summaryText()).toContain("3 shots · 2 on target · 1 goal · 2.28 xG");
    expect(summaryText()).toContain("ARS");

    const totals = screen.getByRole("table", { name: "Shot totals" });
    const onTarget = within(totals).getByRole("row", { name: /On target %/ });
    expect(onTarget.textContent).toContain("67%");
    expect(onTarget.textContent).toContain("0%");
    const conversion = within(totals).getByRole("row", {
      name: /Conversion %/,
    });
    expect(conversion.textContent).toContain("33%");
    expect(
      screen.getByRole("table", { name: "Shot type" }).textContent,
    ).toContain("3 (1)");
  });

  it("respects the team filter", () => {
    setView("stats", "&filter=away");
    render(
      <ToastProvider>
        <ShotsView shots={SHOTS} setShots={vi.fn()} />
      </ToastProvider>,
    );
    const totals = screen.getByRole("table", { name: "Shot totals" });
    expect(within(totals).getAllByRole("columnheader")).toHaveLength(2);
    expect(
      within(totals).getByRole("row", { name: /^Shots/ }).textContent,
    ).toContain("1");
    expect(summaryText()).toContain("1 shot · 0 on target");
    expect(summaryText()).not.toContain("Home");
  });

  it("shows dashes for rates without shots", () => {
    render(
      <ToastProvider>
        <ShotsView shots={[]} setShots={vi.fn()} />
      </ToastProvider>,
    );
    const totals = screen.getByRole("table", { name: "Shot totals" });
    expect(
      within(totals).getByRole("row", { name: /On target %/ }).textContent,
    ).toContain("––");
  });

  it("shows touch stats with a zone grid", () => {
    render(
      <ToastProvider>
        <TouchesView actions={ACTIONS} setActions={vi.fn()} />
      </ToastProvider>,
    );
    expect(summaryText()).toContain("3 actions · 50% pass completion");
    expect(screen.getByTestId("touch-stats")).toBeTruthy();
    const grid = screen.getByRole("group", { name: "All actions" });
    expect(
      within(grid).getByTestId("zone-attacking-left").textContent,
    ).toContain("1");
    expect(
      within(grid).getByTestId("zone-defensive-right").textContent,
    ).toContain("1");
    expect(
      within(screen.getByRole("table", { name: "Actions by type" })).getByRole(
        "row",
        { name: /Tackle/ },
      ).textContent,
    ).toContain("100%");
  });

  it("shows pass chain stats with a zone-to-zone table", () => {
    render(
      <ToastProvider>
        <PassChainsView passChains={CHAINS} setPassChains={vi.fn()} />
      </ToastProvider>,
    );
    expect(summaryText()).toContain("1 chain · 2.0 actions avg");
    expect(
      screen.getByRole("table", { name: "How chains ended" }).textContent,
    ).toContain("Shot saved");
    const zoneTable = screen.getByRole("table", {
      name: "Start third to end third",
    });
    expect(
      within(zoneTable).getByRole("row", { name: /^Def/ }).textContent,
    ).toContain("001");
  });

  it("can be chosen from the view toggle", () => {
    setView("list");
    render(
      <ToastProvider>
        <TouchesView actions={[]} setActions={vi.fn()} />
      </ToastProvider>,
    );
    expect(summaryText()).toContain("0 actions · – pass completion");
    fireEvent.click(screen.getByRole("radio", { name: /Stats/ }));
    expect(screen.getByTestId("touch-stats")).toBeTruthy();
    expect(window.location.search).toBe("?view=stats");
  });

  it("does not show the summary on the pitch view", () => {
    setView("pitch");
    render(
      <ToastProvider>
        <ShotsView shots={SHOTS} setShots={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("stats-summary")).toBeNull();
  });
});
