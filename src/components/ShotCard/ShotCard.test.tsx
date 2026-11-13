import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Shot } from "../../types/Shot";
import { fromMetres } from "../../utils/pitchGeometry";
import ShotCard from "./ShotCard";

const penaltySpot = fromMetres({ x: 34, y: 11 });

const shot: Shot = {
  id: "1",
  ...penaltySpot,
  isGoal: false,
  result: "Saved",
  bodyPart: "Foot",
  shotType: "Open Play",
  team: "home",
  timestamp: 1656789123456,
};

const renderCard = (s: Shot) =>
  render(
    <ShotCard
      shot={s}
      currentIndex={0}
      totalShots={1}
      onNext={vi.fn()}
      onPrevious={vi.fn()}
    />,
  );

describe("ShotCard", () => {
  it("shows the distance and angle to goal in metres", () => {
    renderCard(shot);
    expect(screen.getByText("11.0 m · 37°")).toBeTruthy();
  });

  it("shows the shot's xG with two decimals", () => {
    renderCard({ ...shot, shotType: "Penalty" });
    expect(screen.getByText("Expected goals (xG)")).toBeTruthy();
    expect(screen.getByText("0.76")).toBeTruthy();
  });

  it("measures from the bottom goal for shots in the bottom half", () => {
    renderCard({ ...shot, ...fromMetres({ x: 34, y: 105 - 16.5 }) });
    expect(screen.getByText("16.5 m · 25°")).toBeTruthy();
  });
});
