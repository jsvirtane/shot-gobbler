import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Shot } from "../../types/Shot";
import ShotList from "./ShotList";

describe("ShotList Component", () => {
  // Mock functions
  const mockOnRemoveShot = vi.fn();

  // Mock shots data
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
      playerName: "Boström",
      timestamp: 1656789123456,
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
      timestamp: 1656789234567,
    },
  ];

  // Reset mocks before each test
  beforeEach(() => {
    mockOnRemoveShot.mockReset();
  });

  it("renders empty state when no shots are provided", () => {
    render(<ShotList shots={[]} onRemoveShot={mockOnRemoveShot} />);

    // Check for empty state message
    expect(
      screen.getByText("No shots recorded yet. Click on the pitch to add one."),
    ).toBeTruthy();
  });

  it("renders shot list when shots are provided", () => {
    render(<ShotList shots={mockShots} onRemoveShot={mockOnRemoveShot} />);

    // Check if shots are rendered correctly
    expect(screen.getByText(/goal/)).toBeTruthy();
    expect(screen.getByText(/miss/)).toBeTruthy();
    expect(screen.getByText(/Boström/)).toBeTruthy();
  });

  it("calls onRemoveShot when remove button is clicked", () => {
    render(<ShotList shots={mockShots} onRemoveShot={mockOnRemoveShot} />);

    // Find the first remove button and click it
    const removeButtons = document.querySelectorAll(
      "[title='Remove this shot']",
    );
    fireEvent.click(removeButtons[0]);

    // Check if onRemoveShot was called with the correct ID
    expect(mockOnRemoveShot).toHaveBeenCalledWith(mockShots[0].id);
  });

  it("shows the xG of each shot", () => {
    const shots = [{ ...mockShots[0], shotType: "Penalty" as const }];
    render(<ShotList shots={shots} onRemoveShot={mockOnRemoveShot} />);

    expect(screen.getByText("0.76")).toBeTruthy();
  });

  it("shows the actual result for saved, blocked and old shots", () => {
    const shots = [
      { ...mockShots[1], id: "saved", result: "Saved" as const },
      { ...mockShots[1], id: "blocked", result: "Blocked" as const },
      // Recorded before the result field existed
      { ...mockShots[0], id: "old", result: undefined as never },
    ];
    render(<ShotList shots={shots} onRemoveShot={mockOnRemoveShot} />);

    expect(screen.getByText("saved").className).toContain("text-cyan-600");
    expect(screen.getByText("blocked").className).toContain("text-gray-600");
    expect(screen.getByText("goal").className).toContain("text-green-600");
    expect(screen.queryByText("miss")).toBeNull();
  });
});
