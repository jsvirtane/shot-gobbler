import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Shot } from "../types/Shot";
import ShotsView from "./ShotsView";

// Mock the child components
vi.mock("../components/ShotMap/ShotMap", () => ({
  default: () => <div data-testid="shot-map">Shot Map</div>,
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
  default: () => <div data-testid="shot-form">Shot Form</div>,
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

// Mock useUrlState hook
vi.mock("../hooks/useUrlState", () => ({
  useUrlState: (key: string, defaultValue: string) => {
    // Return "list" view to make Clear All button visible
    if (key === "view") {
      return ["list", vi.fn()];
    }
    // Return "all" filter
    if (key === "filter") {
      return ["all", vi.fn()];
    }
    return [defaultValue, vi.fn()];
  },
}));

import React from "react";

describe("ShotsView", () => {
  const mockSetShots = vi.fn();
  const mockConfirm = vi.spyOn(window, "confirm");

  beforeEach(() => {
    mockSetShots.mockClear();
    mockConfirm.mockClear();
    mockConfirm.mockReturnValue(true);
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

    it("should clear all shots when Clear All button is clicked and confirmed", () => {
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

      mockConfirm.mockReturnValue(true);
      render(<ShotsView shots={mockShots} setShots={mockSetShots} />);

      const clearButton = screen.getByText(/Clear All Shots/i);
      fireEvent.click(clearButton);

      // Confirmation dialog should be shown
      expect(mockConfirm).toHaveBeenCalledWith(
        "Are you sure you want to clear all shots? This cannot be undone.",
      );

      // setShots should be called with empty array
      expect(mockSetShots).toHaveBeenCalledWith([]);
    });

    it("should not clear shots when Clear All is cancelled", () => {
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

      mockConfirm.mockReturnValue(false);
      render(<ShotsView shots={mockShots} setShots={mockSetShots} />);

      const clearButton = screen.getByText(/Clear All Shots/i);
      fireEvent.click(clearButton);

      // Confirmation dialog should be shown
      expect(mockConfirm).toHaveBeenCalled();

      // setShots should NOT be called
      expect(mockSetShots).not.toHaveBeenCalled();
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
});
