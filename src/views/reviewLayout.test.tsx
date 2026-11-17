import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { ToastProvider } from "../components/Toast";
import { Action } from "../types/Action";
import { PassChain } from "../types/PassChain";
import { getZonesFromPassChain } from "../utils/pitchZones";
import PassChainsView from "./PassChainsView";
import TouchesView from "./TouchesView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));
vi.mock("./DocsView", () => ({
  default: () => <div data-testid="docs-view" />,
}));
vi.mock("../components/ShareButton", () => ({
  default: () => <div data-testid="share-button" />,
}));

const action = (
  id: string,
  category: Action["category"],
  actionType: Action["actionType"],
): Action => ({
  id,
  x: 50,
  y: 50,
  category,
  actionType,
  outcome: "successful",
  timestamp: 0,
});

const ACTIONS: Action[] = [
  action("a1", "attacking", "pass"),
  action("a2", "attacking", "dribble"),
  action("a3", "defensive", "tackle"),
  action("a4", "duel", "aerial"),
];

const chain = (
  id: string,
  terminationReason: PassChain["terminationReason"],
): PassChain => {
  const actions: PassChain["actions"] = [
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
  return {
    id,
    actions,
    terminationReason,
    isCompleted: true,
    zones: getZonesFromPassChain(actions),
  };
};

const CHAINS = [chain("c1", "goal"), chain("c2", "intercepted")];

const filter = (group: string, name: string) =>
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: group })).getByRole("radio", {
      name,
    }),
  );

const params = () => new URLSearchParams(window.location.search);

describe("review layout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("puts the view switch in the header and the filters, pitch and summary in one card", () => {
    window.history.replaceState({}, "", "/?tab=touches");
    render(<App />);

    const header = screen.getByRole("banner", { name: "Match and view" });
    const viewSwitch = within(header).getByRole("radiogroup", {
      name: "View",
    });
    expect(
      within(viewSwitch).getByRole("radio", { name: "Pitch" }),
    ).toBeTruthy();
    expect(within(header).getByTestId("match-clock")).toBeTruthy();

    const card = screen.getByTestId("review-card");
    expect(
      within(card).getByRole("radiogroup", { name: "Show actions" }),
    ).toBeTruthy();
    expect(within(card).getByTestId("pitch")).toBeTruthy();
    expect(within(card).getByTestId("stats-summary")).toBeTruthy();

    // Switching view from the header keeps the card's filters
    fireEvent.click(within(viewSwitch).getByRole("radio", { name: "List" }));
    expect(params().get("view")).toBe("list");
    expect(
      within(screen.getByTestId("review-card")).queryByTestId("pitch"),
    ).toBeNull();
  });

  it("has no header in focus mode", () => {
    window.history.replaceState({}, "", "/?tab=shots&focus=1");
    render(<App />);
    expect(screen.queryByRole("banner", { name: "Match and view" })).toBeNull();
    expect(screen.queryByTestId("review-card")).toBeNull();
  });

  it("filters touches by category", () => {
    window.history.replaceState({}, "", "/?view=list");
    render(
      <ToastProvider>
        <TouchesView actions={ACTIONS} setActions={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    filter("Show actions", "Defend");
    expect(params().get("filter")).toBe("defensive");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("tackle");
    // Clearing everything is only offered for the unfiltered list
    expect(screen.queryByText("Clear All")).toBeNull();

    filter("Show actions", "Duel");
    expect(screen.getAllByRole("listitem")[0].textContent).toContain("aerial");
  });

  it("shows every touch in focus mode, whatever the filter", () => {
    window.history.replaceState({}, "", "/?filter=defensive");
    render(
      <ToastProvider>
        <TouchesView actions={ACTIONS} setActions={vi.fn()} focus />
      </ToastProvider>,
    );
    expect(
      screen.queryByRole("radiogroup", { name: "Show actions" }),
    ).toBeNull();
    expect(
      within(screen.getByTestId("pitch")).getAllByRole("button"),
    ).toHaveLength(4);
  });

  it("filters pass chains by whether they ended in a goal", () => {
    window.history.replaceState({}, "", "/?view=list");
    render(
      <ToastProvider>
        <PassChainsView passChains={CHAINS} setPassChains={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByText("Pass Chains (2)")).toBeTruthy();

    filter("Show pass chains", "Goal");
    expect(params().get("filter")).toBe("goal");
    expect(screen.getByText("Pass Chains (1)")).toBeTruthy();

    filter("Show pass chains", "No goal");
    expect(screen.getByText("Pass Chains (1)")).toBeTruthy();
    expect(screen.queryByTestId("clear-all")).toBeNull();
  });
});
