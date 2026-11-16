import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { mockRect, polyfillPointerEvent } from "../test/pointerEvents";
import { EventStamp } from "../types/Match";
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
  timestamp: 1,
  matchId: "m1",
  minute: 67,
  period: "2H",
};

let latestShots: Shot[] = [];

const Harness: React.FC<{ initial: Shot[]; stamp: EventStamp }> = ({
  initial,
  stamp,
}) => {
  const [shots, setShots] = useState<Shot[]>(initial);
  latestShots = shots;
  return (
    <ToastProvider>
      <ShotsView
        shots={shots}
        setShots={setShots}
        teamNames={{ home: "Leeds", away: "Hull" }}
        getEventStamp={() => stamp}
      />
    </ToastProvider>
  );
};

const pick = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("ShotsView with a match", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    mockRect(100, 100);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("shows the team in the ring's centre", () => {
    render(<Harness initial={[]} stamp={{ matchId: "m1" }} />);
    fireEvent.click(screen.getByAltText("Football Pitch"));
    expect(
      screen.getByRole("button", { name: "Team Leeds. Tap to switch team" }),
    ).toBeTruthy();
  });

  it("shows the team names on the pitch and in the filter", () => {
    render(<Harness initial={[]} stamp={{ matchId: "m1" }} />);
    expect(screen.getByRole("radio", { name: "Leeds" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Hull" })).toBeTruthy();
    expect(screen.getAllByText("Leeds").length).toBeGreaterThan(1);
  });

  it("stamps a new shot with the match, minute and period from the clock", () => {
    render(
      <Harness
        initial={[]}
        stamp={{ matchId: "m1", minute: 23, period: "1H" }}
      />,
    );
    fireEvent.click(screen.getByAltText("Football Pitch"));
    pick("Saved");

    expect(latestShots[0]).toMatchObject({
      matchId: "m1",
      minute: 23,
      period: "1H",
    });
  });

  it("edits a shot keeping its match, minute and period", () => {
    render(
      <Harness
        initial={[SHOT]}
        stamp={{ matchId: "m1", minute: 5, period: "1H" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Set Piece - Head/ }));
    expect(screen.getByRole("button", { name: "Minute 67" })).toBeTruthy();
    pick("Goal");

    expect(latestShots[0]).toMatchObject({
      result: "Goal",
      matchId: "m1",
      minute: 67,
      period: "2H",
    });
  });
});
