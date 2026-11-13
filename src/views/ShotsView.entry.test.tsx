import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Shot } from "../types/Shot";
import {
  QUICK_MODE_STORAGE_KEY,
  SHOT_DEFAULTS_STORAGE_KEY,
} from "../utils/shotEntryPrefs";
import ShotsView from "./ShotsView";

// Replace the pitch with a button that "taps" it at a fixed position
vi.mock("../components/ShotMap/ShotMap", () => ({
  default: ({
    onPitchClick,
  }: {
    onPitchClick: (x: number, y: number) => void;
  }) => (
    <button data-testid="pitch" onClick={() => onPitchClick(40, 60)}>
      Pitch
    </button>
  ),
}));

let latestShots: Shot[] = [];

const Harness: React.FC = () => {
  const [shots, setShots] = useState<Shot[]>([]);
  latestShots = shots;
  return <ShotsView shots={shots} setShots={setShots} />;
};

const isSelected = (text: string) =>
  screen.getByText(text).className.includes("bg-blue-600");

describe("ShotsView shot entry", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    latestShots = [];
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("remembered form choices", () => {
    it("pre-fills the form with the last-used choices, resetting only the result", () => {
      render(<Harness />);

      fireEvent.click(screen.getByTestId("pitch"));
      fireEvent.click(screen.getByText("🚌 Away"));
      fireEvent.click(screen.getByText("⚽ Goal"));
      fireEvent.click(screen.getByText("👤 Head"));
      fireEvent.click(screen.getByText("Set Piece"));
      fireEvent.change(screen.getByPlaceholderText("e.g., Ronaldo or 7"), {
        target: { value: "9" },
      });
      fireEvent.click(screen.getByText("Add Shot"));

      fireEvent.click(screen.getByTestId("pitch"));
      expect(isSelected("🚌 Away")).toBe(true);
      expect(isSelected("👤 Head")).toBe(true);
      expect(isSelected("Set Piece")).toBe(true);
      expect(isSelected("❌ Miss")).toBe(true);
      expect(
        (screen.getByPlaceholderText("e.g., Ronaldo or 7") as HTMLInputElement)
          .value,
      ).toBe("9");
    });

    it("persists the choices across reloads", () => {
      const { unmount } = render(<Harness />);
      fireEvent.click(screen.getByTestId("pitch"));
      fireEvent.click(screen.getByText("🦵 Other"));
      fireEvent.click(screen.getByText("Penalty"));
      fireEvent.click(screen.getByText("Add Shot"));
      unmount();

      expect(
        JSON.parse(localStorage.getItem(SHOT_DEFAULTS_STORAGE_KEY) ?? "{}"),
      ).toEqual({
        team: "home",
        bodyPart: "Other",
        shotType: "Penalty",
        playerName: "",
      });

      render(<Harness />);
      fireEvent.click(screen.getByTestId("pitch"));
      expect(isSelected("🦵 Other")).toBe(true);
      expect(isSelected("Penalty")).toBe(true);
    });

    it("works when storage is unavailable", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });

      render(<Harness />);
      fireEvent.click(screen.getByRole("switch", { name: /Quick entry/ }));
      fireEvent.click(screen.getByTestId("pitch"));
      fireEvent.click(screen.getByRole("button", { name: /Goal/ }));

      expect(latestShots).toHaveLength(1);
    });
  });

  describe("quick mode", () => {
    it("saves a shot with one tap using the remembered choices", () => {
      localStorage.setItem(
        SHOT_DEFAULTS_STORAGE_KEY,
        JSON.stringify({
          team: "away",
          bodyPart: "Head",
          shotType: "Set Piece",
          playerName: "7",
        }),
      );
      localStorage.setItem(QUICK_MODE_STORAGE_KEY, "true");
      render(<Harness />);

      fireEvent.click(screen.getByTestId("pitch"));
      expect(screen.getByRole("dialog", { name: "Quick Shot" })).toBeTruthy();
      expect(screen.getByTestId("quick-shot-summary").textContent).toBe(
        "🚌 Away · 👤 Head · Set Piece · 7",
      );

      fireEvent.click(screen.getByRole("button", { name: /Goal/ }));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(latestShots).toHaveLength(1);
      expect(latestShots[0]).toMatchObject({
        x: 40,
        y: 60,
        result: "Goal",
        isGoal: true,
        team: "away",
        bodyPart: "Head",
        shotType: "Set Piece",
        playerName: "7",
      });
    });

    it("switches to the full form via More details", () => {
      localStorage.setItem(QUICK_MODE_STORAGE_KEY, "true");
      render(<Harness />);

      fireEvent.click(screen.getByTestId("pitch"));
      fireEvent.click(screen.getByText("More details…"));

      expect(screen.getByRole("dialog", { name: "New Shot" })).toBeTruthy();
      fireEvent.click(screen.getByText("Add Shot"));
      expect(latestShots[0]).toMatchObject({ x: 40, y: 60 });
    });

    it("persists the quick entry toggle", () => {
      const { unmount } = render(<Harness />);
      const toggle = screen.getByRole("switch", { name: /Quick entry/ });
      expect(toggle.getAttribute("aria-checked")).toBe("false");

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-checked")).toBe("true");
      expect(localStorage.getItem(QUICK_MODE_STORAGE_KEY)).toBe("true");
      unmount();

      render(<Harness />);
      expect(
        screen
          .getByRole("switch", { name: /Quick entry/ })
          .getAttribute("aria-checked"),
      ).toBe("true");
      fireEvent.click(screen.getByTestId("pitch"));
      expect(screen.getByRole("dialog", { name: "Quick Shot" })).toBeTruthy();
    });

    it("opens the full form when quick entry is off", () => {
      render(<Harness />);
      fireEvent.click(screen.getByTestId("pitch"));
      expect(screen.getByRole("dialog", { name: "New Shot" })).toBeTruthy();
    });
  });
});
