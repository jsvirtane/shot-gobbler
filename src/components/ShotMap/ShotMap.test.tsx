import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Shot } from "../../types/Shot";
import ShotMap from "./ShotMap";

// Mock the SVG import
vi.mock("../../assets/football_pitch.svg", () => ({
  default: "mocked-football-pitch",
}));

describe("ShotMap Component", () => {
  // Test props
  const mockOnPitchClick = vi.fn();
  const mockShots: Shot[] = [
    {
      id: "1",
      x: 50, // center of pitch horizontally
      y: 25, // top quarter of pitch
      isGoal: true,
      bodyPart: "Foot",
      shotType: "Open Play",
      team: "home",
      playerName: "Player 1",
      timestamp: Date.now(),
    },
    {
      id: "2",
      x: 50, // center of pitch horizontally
      y: 75, // bottom quarter of pitch
      isGoal: false,
      bodyPart: "Head",
      shotType: "Set Piece",
      team: "away",
      timestamp: Date.now(),
    },
  ];

  // Setup mock for getBoundingClientRect
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    // Reset mock before each test
    mockOnPitchClick.mockReset();
  });

  it("renders the football pitch", () => {
    render(<ShotMap onPitchClick={mockOnPitchClick} shots={[]} />);

    const pitchImage = screen.getByAltText("Football Pitch");
    // Replace toBeInTheDocument with direct assertion
    expect(pitchImage).toBeTruthy();
    expect(pitchImage.classList.contains("bg-green-700")).toBe(true);
  });

  it("renders shots on the pitch", () => {
    render(<ShotMap onPitchClick={mockOnPitchClick} shots={mockShots} />);

    // Should render exactly 2 shot elements
    const shotElements = document.querySelectorAll(".transform.rounded-full");
    expect(shotElements.length).toBe(2);

    // Check appropriate styling based on team and goal/miss
    const homeGoalShot = shotElements[0] as HTMLElement;
    const awayMissShot = shotElements[1] as HTMLElement;

    // Home goal should have yellow background
    expect(homeGoalShot.classList.contains("bg-yellow-400")).toBe(true);

    // Away miss should have purple background
    expect(awayMissShot.classList.contains("bg-purple-500")).toBe(true);

    // Check tooltip content
    expect(homeGoalShot.title).toContain("home");
    expect(homeGoalShot.title).toContain("Open Play");
    expect(homeGoalShot.title).toContain("Foot");
    expect(homeGoalShot.title).toContain("Player 1");

    expect(awayMissShot.title).toContain("away");
    expect(awayMissShot.title).toContain("Set Piece");
    expect(awayMissShot.title).toContain("Head");
  });

  it("calls onPitchClick when pitch is clicked with correct relative coordinates", () => {
    render(<ShotMap onPitchClick={mockOnPitchClick} shots={[]} />);

    const pitchDiv = document.querySelector(".cursor-crosshair");
    expect(pitchDiv).not.toBeNull();

    // Click in the middle of the pitch (50,50)
    fireEvent.click(pitchDiv!, { clientX: 50, clientY: 50 });

    // Should convert to relative coordinates (50%, 50%)
    expect(mockOnPitchClick).toHaveBeenCalledWith(50, 50);

    // Click at another position (25,75)
    fireEvent.click(pitchDiv!, { clientX: 25, clientY: 75 });

    // Should call with correct relative coordinates
    expect(mockOnPitchClick).toHaveBeenCalledWith(25, 75);
  });

  it("handles clicks on existing shots", () => {
    render(<ShotMap onPitchClick={mockOnPitchClick} shots={mockShots} />);

    const shotElements = document.querySelectorAll(".transform.rounded-full");
    fireEvent.click(shotElements[0]);

    // Should still trigger the click handler
    expect(mockOnPitchClick).toHaveBeenCalled();
  });

  it("ignores clicks outside the pitch boundaries", () => {
    render(<ShotMap onPitchClick={mockOnPitchClick} shots={[]} />);

    const pitchDiv = document.querySelector(".cursor-crosshair");

    // Click outside the right boundary
    fireEvent.click(pitchDiv!, { clientX: 150, clientY: 50 });

    // Should not call the handler
    expect(mockOnPitchClick).not.toHaveBeenCalled();

    // Click outside the bottom boundary
    fireEvent.click(pitchDiv!, { clientX: 50, clientY: 150 });

    // Should not call the handler
    expect(mockOnPitchClick).not.toHaveBeenCalled();
  });
});
