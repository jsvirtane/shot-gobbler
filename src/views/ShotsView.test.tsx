import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Team } from "../types/common";
import { Shot } from "../types/Shot";
import { ToastProvider } from "../components/Toast";
import ShotsView from "./ShotsView";

// Initial values for the mocked URL state, adjustable per test
const urlDefaults = vi.hoisted(() => ({
  view: "list",
  filter: "all",
}));

// Mock the child components
vi.mock("../components/ShotMap/ShotMap", () => ({
  default: ({
    onPitchClick,
  }: {
    onPitchClick: (x: number, y: number) => void;
  }) => (
    <button data-testid="shot-map" onClick={() => onPitchClick(50, 50)}>
      Shot Map
    </button>
  ),
}));

vi.mock("../components/ShotList/ShotList", () => ({
  default: ({
    shots,
    onRemoveShot,
  }: {
    shots: Shot[];
    onRemoveShot: (id: string) => void;
  }) => (
    <div data-testid="shot-list">
      <div data-testid="shots-count">{shots.length}</div>
      {shots.map((shot) => (
        <div key={shot.id} data-testid={`shot-${shot.id}`}>
          <button onClick={() => onRemoveShot(shot.id)}>Remove</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../components/ShotForm/ShotForm", () => ({
  default: ({
    isOpen,
    defaultTeam,
    onSubmit,
    onClose,
  }: {
    isOpen: boolean;
    defaultTeam: Team;
    onSubmit: (details: Omit<Shot, "id" | "timestamp">) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="shot-form">
        <span data-testid="form-default-team">{defaultTeam}</span>
        <button
          onClick={() => {
            onSubmit({
              x: 50,
              y: 50,
              isGoal: false,
              result: "Miss",
              bodyPart: "Foot",
              shotType: "Open Play",
              team: "away",
            });
            onClose();
          }}
        >
          Submit away shot
        </button>
      </div>
    ) : null,
}));

vi.mock("../components/ViewToggle/ViewToggle", () => ({
  default: () => <div data-testid="view-toggle">View Toggle</div>,
}));

vi.mock("../components/ShotCard", () => ({
  default: () => <div data-testid="shot-card">Shot Card</div>,
}));

vi.mock("../components/Accordion", () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion">{children}</div>
  ),
}));

// Mock useUrlState hook with plain component state (no URL syncing)
vi.mock("../hooks/useUrlState", async () => {
  const { useState } = await vi.importActual<typeof import("react")>("react");
  return {
    useUrlState: (key: string, defaultValue: string) =>
      useState(
        (urlDefaults as Record<string, string | undefined>)[key] ??
          defaultValue,
      ),
  };
});

import React from "react";

describe("ShotsView", () => {
  const mockSetShots = vi.fn();

  beforeEach(() => {
    // List view makes the Clear All button visible
    urlDefaults.view = "list";
    urlDefaults.filter = "all";
    mockSetShots.mockClear();
  });

  describe("Clear All Shots", () => {
    it("should show Clear All button when shots exist and filter is 'all'", () => {
      const mockShots: Shot[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          isGoal: true,
          result: "Goal",
          bodyPart: "Foot",
          shotType: "Open Play",
          team: "home",
          playerName: "Player 1",
          timestamp: Date.now(),
        },
      ];

      render(<ShotsView shots={mockShots} setShots={mockSetShots} />);

      // The Clear All button should be visible
      expect(screen.queryByText(/Clear All Shots/i)).toBeTruthy();
    });

    it("should not show Clear All button when no shots exist", () => {
      render(<ShotsView shots={[]} setShots={mockSetShots} />);

      // The Clear All button should not be visible
      expect(screen.queryByText(/Clear All Shots/i)).toBeNull();
    });

    it("should clear all shots without asking for confirmation", () => {
      const mockShots: Shot[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          isGoal: true,
          result: "Goal",
          bodyPart: "Foot",
          shotType: "Open Play",
          team: "home",
          playerName: "Player 1",
          timestamp: Date.now(),
        },
        {
          id: "2",
          x: 50,
          y: 20,
          isGoal: false,
          result: "Miss",
          bodyPart: "Head",
          shotType: "Set Piece",
          team: "away",
          playerName: "Player 2",
          timestamp: Date.now(),
        },
      ];

      const confirmSpy = vi.spyOn(window, "confirm");
      render(<ShotsView shots={mockShots} setShots={mockSetShots} />);

      const clearButton = screen.getByText(/Clear All Shots/i);
      fireEvent.click(clearButton);

      expect(confirmSpy).not.toHaveBeenCalled();
      confirmSpy.mockRestore();

      // setShots should be called with empty array
      expect(mockSetShots).toHaveBeenCalledWith([]);
    });
  });

  describe("Shot Removal", () => {
    it("should remove individual shot when remove button is clicked", () => {
      const mockShots: Shot[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          isGoal: true,
          result: "Goal",
          bodyPart: "Foot",
          shotType: "Open Play",
          team: "home",
          playerName: "Player 1",
          timestamp: Date.now(),
        },
        {
          id: "2",
          x: 50,
          y: 20,
          isGoal: false,
          result: "Miss",
          bodyPart: "Head",
          shotType: "Set Piece",
          team: "away",
          playerName: "Player 2",
          timestamp: Date.now(),
        },
      ];

      render(<ShotsView shots={mockShots} setShots={mockSetShots} />);

      // Find and click remove button for first shot
      const removeButton = screen.getAllByText(/Remove/i)[0];
      fireEvent.click(removeButton);

      // setShots should be called with a function
      expect(mockSetShots).toHaveBeenCalled();

      // Get the updater function that was passed to setShots
      const updaterFn = mockSetShots.mock.calls[0][0];
      const newShots = updaterFn(mockShots);

      // Should only have the second shot remaining
      expect(newShots).toHaveLength(1);
      expect(newShots[0].id).toBe("2");
    });
  });

  describe("Form default team", () => {
    beforeEach(() => {
      urlDefaults.view = "pitch";
    });

    it("keeps the last-used team when switching back to All Shots", () => {
      render(<ShotsView shots={[]} setShots={mockSetShots} />);

      // Record an away shot while filtering by Away
      fireEvent.click(screen.getByRole("radio", { name: "Away" }));
      fireEvent.click(screen.getByTestId("shot-map"));
      expect(screen.getByTestId("form-default-team").textContent).toBe("away");
      fireEvent.click(screen.getByText("Submit away shot"));

      // Back to All Shots: the form should still default to Away
      fireEvent.click(screen.getByText("All Shots"));
      fireEvent.click(screen.getByTestId("shot-map"));
      expect(screen.getByTestId("form-default-team").textContent).toBe("away");
    });

    it("pre-selects the filtered team when filtering by Home or Away", () => {
      render(<ShotsView shots={[]} setShots={mockSetShots} />);

      fireEvent.click(screen.getByRole("radio", { name: "Away" }));
      fireEvent.click(screen.getByTestId("shot-map"));
      fireEvent.click(screen.getByText("Submit away shot"));

      fireEvent.click(screen.getByRole("radio", { name: "Home" }));
      fireEvent.click(screen.getByTestId("shot-map"));
      expect(screen.getByTestId("form-default-team").textContent).toBe("home");
    });
  });

  describe("Undo", () => {
    const makeShot = (id: string): Shot => ({
      id,
      x: 30,
      y: 40,
      isGoal: false,
      result: "Miss",
      bodyPart: "Foot",
      shotType: "Open Play",
      team: "home",
      timestamp: 1,
    });

    // Real state, so the undo updates can be checked
    const Harness: React.FC<{ initial: Shot[] }> = ({ initial }) => {
      const [shots, setShots] = React.useState(initial);
      return (
        <ToastProvider>
          <ShotsView shots={shots} setShots={setShots} />
          <div data-testid="ids">{shots.map((s) => s.id).join(",")}</div>
        </ToastProvider>
      );
    };
    const ids = () => screen.getByTestId("ids").textContent;

    it("clears all shots and restores them on Undo", () => {
      render(<Harness initial={[makeShot("a"), makeShot("b")]} />);

      fireEvent.click(screen.getByText(/Clear All Shots/i));
      expect(ids()).toBe("");
      expect(screen.getByRole("status").textContent).toContain(
        "Cleared 2 shots",
      );

      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(ids()).toBe("a,b");
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("removes a shot and restores it at its original index on Undo", () => {
      render(
        <Harness initial={[makeShot("a"), makeShot("b"), makeShot("c")]} />,
      );

      fireEvent.click(
        within(screen.getByTestId("shot-b")).getByRole("button", {
          name: "Remove",
        }),
      );
      expect(ids()).toBe("a,c");
      expect(screen.getByRole("status").textContent).toContain("Shot removed");

      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(ids()).toBe("a,b,c");
    });

    it("removes an added shot on Undo, keeping other shots", () => {
      urlDefaults.view = "pitch";
      render(<Harness initial={[makeShot("a")]} />);

      fireEvent.click(screen.getByTestId("shot-map"));
      fireEvent.click(screen.getByText("Submit away shot"));
      expect(ids()?.split(",")).toHaveLength(2);
      expect(screen.getByRole("status").textContent).toContain("Shot added");

      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(ids()).toBe("a");
    });
  });
});
