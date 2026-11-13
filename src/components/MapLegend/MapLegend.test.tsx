import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TEAM_MARKER_COLORS } from "../../constants/markerColors";
import { PassChainLegend, ShotLegend, TouchLegend } from "./MapLegend";

const items = () => screen.getAllByTestId("legend-item");
const itemFor = (label: string) =>
  items().find((item) => item.textContent === label)!;
const shapeOf = (label: string) =>
  itemFor(label).querySelector("svg")?.getAttribute("data-shape");

describe("ShotLegend", () => {
  it("explains result shapes", () => {
    render(<ShotLegend />);
    expect(shapeOf("Goal")).toBe("star");
    expect(shapeOf("Saved")).toBe("circle");
    expect(shapeOf("Blocked")).toBe("triangle");
    expect(shapeOf("Miss")).toBe("ring");
  });

  it("shows team colours with default names", () => {
    render(<ShotLegend />);
    const home = itemFor("Home").querySelector("svg")!;
    expect(home.getAttribute("data-color")).toBe(TEAM_MARKER_COLORS.home);
    const away = itemFor("Away").querySelector("svg")!;
    expect(away.getAttribute("data-color")).toBe(TEAM_MARKER_COLORS.away);
  });

  it("uses the given team names", () => {
    render(<ShotLegend teamLabels={{ home: "Reds", away: "Blues" }} />);
    expect(itemFor("Reds")).toBeTruthy();
    expect(itemFor("Blues")).toBeTruthy();
  });

  it("explains that size follows xG", () => {
    render(<ShotLegend />);
    expect(
      within(screen.getByTestId("map-legend")).getByText(/xG/),
    ).toBeTruthy();
  });
});

describe("TouchLegend", () => {
  it("lists categories and filled vs hollow outcomes", () => {
    render(<TouchLegend />);
    expect(itemFor("Attacking")).toBeTruthy();
    expect(itemFor("Defensive")).toBeTruthy();
    expect(itemFor("Duel")).toBeTruthy();
    expect(shapeOf("Successful")).toBe("circle");
    expect(shapeOf("Unsuccessful")).toBe("ring");
  });
});

describe("PassChainLegend", () => {
  it("lists action types and chain ends", () => {
    render(<PassChainLegend />);
    for (const label of ["Pass", "Carry", "Shot", "Cross", "Start"]) {
      expect(itemFor(label)).toBeTruthy();
    }
    expect(itemFor("Ended in goal")).toBeTruthy();
  });
});
