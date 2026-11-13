import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Shot } from "../../types/Shot";
import XgTotals from "./XgTotals";

const penalty = (id: string, team: Shot["team"]): Shot => ({
  id,
  x: 50,
  y: 12,
  isGoal: true,
  result: "Goal",
  bodyPart: "Foot",
  shotType: "Penalty",
  team,
  timestamp: 0,
});

describe("XgTotals", () => {
  it("shows the total xG per team", () => {
    render(
      <XgTotals
        shots={[
          penalty("1", "home"),
          penalty("2", "home"),
          penalty("3", "away"),
        ]}
      />,
    );
    expect(screen.getByTestId("xg-totals").textContent).toBe(
      "Home 1.52 xG · Away 0.76 xG",
    );
  });

  it("leaves out teams without shots", () => {
    render(<XgTotals shots={[penalty("1", "away")]} />);
    expect(screen.getByTestId("xg-totals").textContent).toBe("Away 0.76 xG");
  });

  it("uses the match's team names", () => {
    render(
      <XgTotals
        shots={[penalty("1", "away")]}
        teamNames={{ home: "Leeds", away: "Hull" }}
      />,
    );
    expect(screen.getByTestId("xg-totals").textContent).toBe("Hull 0.76 xG");
  });

  it("renders nothing without shots", () => {
    const { container } = render(<XgTotals shots={[]} />);
    expect(container.textContent).toBe("");
  });
});
