import { fireEvent, render, screen, within } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { mockRect } from "../test/pointerEvents";
import { DEFAULT_MATCH_ID } from "../types/Match";
import { Shot } from "../types/Shot";
import { penaltySpot } from "../utils/shotDraft";
import { shotXg } from "../utils/xg";
import ShotsView from "./ShotsView";

vi.mock("../assets/football_pitch.svg", () => ({ default: "pitch.svg" }));

let latestShots: Shot[] = [];

const Harness: React.FC<{ focus?: boolean }> = ({ focus }) => {
  const [shots, setShots] = useState<Shot[]>([]);
  latestShots = shots;
  return (
    <ToastProvider>
      <ShotsView
        shots={shots}
        setShots={setShots}
        teamNames={{ home: "Arsenal", away: "Leeds" }}
        focus={focus}
      />
    </ToastProvider>
  );
};

/** Taps the pitch at full-pitch % (the pitch is mocked as 100 x 100 px). */
const tapPitch = (x: number, y: number) =>
  fireEvent.click(document.getElementById("share-pitch")!, {
    clientX: x,
    clientY: y,
  });

const ring = () => screen.getByTestId("radial-menu");
const option = (name: string) => within(ring()).getByRole("button", { name });
const pick = (name: string) => fireEvent.click(option(name));
const centre = () => screen.getByTestId("radial-center");

describe("ShotsView radial shot entry", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    latestShots = [];
    mockRect(100, 100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has no quick entry switch", () => {
    render(<Harness />);
    expect(screen.queryByRole("switch", { name: /Quick entry/ })).toBeNull();
  });

  it("records a shot with one tap on a result", () => {
    render(<Harness />);
    tapPitch(40, 20);
    expect(screen.getByRole("dialog", { name: "New shot" })).toBeTruthy();
    pick("Saved");

    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toHaveLength(1);
    expect(latestShots[0]).toMatchObject({
      x: 40,
      y: 20,
      team: "home",
      result: "Saved",
      isGoal: false,
      bodyPart: "Foot",
      shotType: "Open Play",
      matchId: DEFAULT_MATCH_ID,
    });
    expect(latestShots[0].playerName).toBeUndefined();
  });

  it("takes the team from the half tapped", () => {
    render(<Harness />);
    tapPitch(40, 20);
    expect(centre().getAttribute("aria-label")).toContain("Arsenal");
    expect(centre().textContent).toContain("ARS");
    fireEvent.keyDown(document, { key: "Escape" });

    tapPitch(40, 80);
    expect(centre().getAttribute("aria-label")).toContain("Leeds");
    pick("Miss");
    expect(latestShots[0]).toMatchObject({ team: "away", x: 40, y: 80 });
  });

  it("records a headed goal with Head then Goal", () => {
    render(<Harness />);
    tapPitch(50, 10);
    pick("Header");
    // The toggle keeps the ring open and shows as on
    expect(option("Header").getAttribute("aria-pressed")).toBe("true");
    expect(latestShots).toHaveLength(0);
    pick("Goal");

    expect(latestShots[0]).toMatchObject({
      bodyPart: "Head",
      result: "Goal",
      isGoal: true,
    });
  });

  it("resets the toggles and shirt number after each save", () => {
    render(<Harness />);
    tapPitch(50, 10);
    pick("Header");
    pick("Set piece");
    pick("Shirt number");
    pick("7");
    pick("Done");
    pick("Miss");

    tapPitch(50, 10);
    expect(option("Header").getAttribute("aria-pressed")).toBe("false");
    expect(option("Set piece").getAttribute("aria-pressed")).toBe("false");
    expect(option("Shirt number")).toBeTruthy();
    pick("Miss");
    expect(latestShots[1]).toMatchObject({
      bodyPart: "Foot",
      shotType: "Open Play",
    });
    expect(latestShots[1].playerName).toBeUndefined();
  });

  it("Set piece and Penalty exclude each other; Penalty moves to the spot and clears Head", () => {
    render(<Harness />);
    tapPitch(30, 30);
    pick("Header");
    pick("Set piece");
    pick("Penalty");
    expect(option("Penalty").getAttribute("aria-pressed")).toBe("true");
    expect(option("Set piece").getAttribute("aria-pressed")).toBe("false");
    expect(option("Header").getAttribute("aria-pressed")).toBe("false");

    pick("Set piece");
    expect(option("Penalty").getAttribute("aria-pressed")).toBe("false");
    pick("Penalty");
    pick("Goal");

    const spot = penaltySpot("home");
    expect(latestShots[0]).toMatchObject({
      shotType: "Penalty",
      bodyPart: "Foot",
      x: spot.x,
      y: spot.y,
    });
  });

  it("turning Penalty off puts the shot back where it was tapped", () => {
    render(<Harness />);
    tapPitch(30, 30);
    pick("Penalty");
    pick("Penalty");
    pick("Miss");
    expect(latestShots[0]).toMatchObject({
      shotType: "Open Play",
      x: 30,
      y: 30,
    });
  });

  it("switching the team from the centre stores attacking coordinates, so xG is right", () => {
    render(<Harness />);
    // A tap in the bottom half is an away shot; switch it to home
    tapPitch(30, 85);
    fireEvent.click(centre());
    expect(centre().getAttribute("aria-label")).toContain("Arsenal");
    pick("Saved");

    const shot = latestShots[0];
    expect(shot).toMatchObject({ team: "home", x: 70, y: 15 });
    // Same distance and angle to the goal it attacks as the tap
    expect(shotXg(shot)).toBeCloseTo(shotXg({ ...shot, x: 30, y: 85 }), 10);
  });

  it("switching back and forth returns to the tapped point", () => {
    render(<Harness />);
    tapPitch(30, 85);
    fireEvent.click(centre());
    fireEvent.click(centre());
    pick("Saved");
    expect(latestShots[0]).toMatchObject({ team: "away", x: 30, y: 85 });
  });

  it("enters a shirt number on the dial", () => {
    render(<Harness />);
    tapPitch(50, 20);
    pick("Shirt number");
    expect(screen.getByRole("dialog", { name: "Shirt number" })).toBeTruthy();
    pick("1");
    pick("0");
    // Up to two digits
    pick("4");
    expect(centre().textContent).toContain("#10");
    pick("Delete digit");
    pick("7");
    pick("Done");

    expect(option("Shirt number 17")).toBeTruthy();
    pick("Blocked");
    expect(latestShots[0]).toMatchObject({ playerName: "17" });
  });

  it("the dial's centre clears the shirt number", () => {
    render(<Harness />);
    tapPitch(50, 20);
    pick("Shirt number");
    pick("9");
    pick("Done");
    pick("Shirt number 9");
    fireEvent.click(screen.getByRole("button", { name: "Clear shirt number" }));
    expect(option("Shirt number")).toBeTruthy();
    pick("Miss");
    expect(latestShots[0].playerName).toBeUndefined();
  });

  it("closing the ring records nothing", () => {
    render(<Harness />);
    tapPitch(50, 20);
    pick("Header");
    fireEvent.click(screen.getByTestId("radial-backdrop"));
    expect(screen.queryByTestId("radial-menu")).toBeNull();
    expect(latestShots).toHaveLength(0);
  });

  it("stamps the shot with the minute and period at the tap", () => {
    const stamp = vi.fn(() => ({
      matchId: "m1",
      minute: 23,
      period: "1H" as const,
    }));
    const WithStamp: React.FC = () => {
      const [shots, setShots] = useState<Shot[]>([]);
      latestShots = shots;
      return (
        <ToastProvider>
          <ShotsView shots={shots} setShots={setShots} getEventStamp={stamp} />
        </ToastProvider>
      );
    };
    render(<WithStamp />);
    tapPitch(50, 20);
    stamp.mockReturnValue({ matchId: "m1", minute: 30, period: "1H" });
    pick("Goal");
    expect(latestShots[0]).toMatchObject({
      matchId: "m1",
      minute: 23,
      period: "1H",
    });
  });

  it("Undo removes a recorded shot", () => {
    render(<Harness />);
    tapPitch(50, 20);
    pick("Goal");
    expect(screen.getByRole("status").textContent).toContain("Shot added");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(latestShots).toHaveLength(0);
  });

  it("works the same in focus mode", () => {
    render(<Harness focus />);
    tapPitch(50, 20);
    pick("Saved");
    expect(latestShots).toHaveLength(1);
  });

  describe("half pitch", () => {
    beforeEach(() => {
      window.history.replaceState({}, "", "/?tab=shots&pitch=half");
    });

    const teamToggle = () =>
      screen.getByRole("button", { name: /^Team for new shots/ });
    const marker = () => screen.getByTestId("shot-marker");

    it("puts the goal at the bottom and records shots for the toggle's team", () => {
      render(<Harness />);
      expect(screen.getByTestId("pitch-label-bottom").textContent).toBe(
        "Goal ↓ · Arsenal",
      );
      // 100px of visible height covers y 50-100: a tap near the bottom goal
      tapPitch(40, 80);
      expect(centre().getAttribute("aria-label")).toContain("Arsenal");
      pick("Goal");

      // Stored attacking the top goal (home), shown where it was tapped
      expect(latestShots[0]).toMatchObject({ team: "home", x: 60, y: 10 });
      expect(marker().style.left).toBe("40%");
      expect(marker().style.top).toBe("90%");
    });

    it("the team toggle switches the team for the next shots", () => {
      render(<Harness />);
      fireEvent.click(teamToggle());
      expect(teamToggle().textContent).toContain("Leeds");
      expect(screen.getByTestId("pitch-label-bottom").textContent).toBe(
        "Goal ↓ · Leeds",
      );
      tapPitch(40, 80);
      pick("Saved");
      tapPitch(60, 70);
      pick("Miss");
      expect(latestShots.map((s) => [s.team, s.x, s.y])).toEqual([
        ["away", 40, 90],
        ["away", 60, 85],
      ]);
    });

    it("the ring's centre still switches the team of one shot", () => {
      render(<Harness />);
      tapPitch(40, 80);
      fireEvent.click(centre());
      pick("Saved");
      tapPitch(40, 80);
      pick("Saved");
      expect(latestShots.map((s) => s.team)).toEqual(["away", "home"]);
      // Both are shown where they were tapped
      for (const m of screen.getAllByTestId("shot-marker")) {
        expect(m.style.left).toBe("40%");
        expect(m.style.top).toBe("90%");
      }
    });

    it("a shot from the half view is in the right place on the full pitch", () => {
      render(<Harness />);
      tapPitch(40, 80);
      pick("Goal");
      fireEvent.click(screen.getByRole("button", { name: "Full pitch" }));
      // A home shot near the top goal on the full pitch
      expect(marker().style.left).toBe("60%");
      expect(marker().style.top).toBe("10%");
    });

    it("Move in the half view puts the shot where the finger is", () => {
      render(<Harness />);
      tapPitch(40, 80);
      pick("Goal");
      fireEvent.click(marker());
      pick("Move");
      tapPitch(20, 60);
      expect(latestShots[0]).toMatchObject({ team: "home", x: 80, y: 20 });
      expect(marker().style.left).toBe("20%");
      expect(marker().style.top).toBe("80%");
    });
  });
});
