import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Shot } from "../../types/Shot";
import { longPressDrag, polyfillPointerEvent } from "../../test/pointerEvents";
import ShotMap from "./ShotMap";

// Mock the SVG import
vi.mock("../../assets/football_pitch.svg", () => ({
  default: "mocked-football-pitch",
}));

polyfillPointerEvent();

describe("ShotMap Component", () => {
  // Test props
  const mockOnPitchClick = vi.fn();
  const mockShots: Shot[] = [
    {
      id: "1",
      x: 50, // center of pitch horizontally
      y: 25, // top quarter of pitch
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
      x: 50, // center of pitch horizontally
      y: 75, // bottom quarter of pitch
      isGoal: false,
      result: "Miss",
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

    // Should render exactly 2 shot markers
    const shotElements = screen.getAllByTestId("shot-marker");
    expect(shotElements.length).toBe(2);

    // Check appropriate styling based on team and goal/miss
    const homeGoalShot = shotElements[0];
    const awayMissShot = shotElements[1];

    // Home goal should have yellow background
    expect(homeGoalShot.querySelector(".bg-yellow-400")).not.toBeNull();

    // Away miss should have purple background
    expect(awayMissShot.querySelector(".bg-purple-500")).not.toBeNull();

    // Check tooltip content
    expect(homeGoalShot.title).toContain("Open Play");
    expect(homeGoalShot.title).toContain("Foot");
    expect(homeGoalShot.title).toContain("Player 1");

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

  it("passes clicks on read-only markers through to the pitch", () => {
    render(<ShotMap onPitchClick={mockOnPitchClick} shots={mockShots} />);

    const [marker] = screen.getAllByTestId("shot-marker");
    expect(marker.tagName).toBe("DIV");
    expect(marker.className).toContain("pointer-events-none");
    fireEvent.click(marker);
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

  it("mirrors bottom-half shots into the top half in half view", () => {
    render(
      <ShotMap
        onPitchClick={mockOnPitchClick}
        shots={mockShots}
        variant="half-top"
      />,
    );

    const [home, away] = screen.getAllByTestId("shot-marker");
    expect(home.style.top).toBe("25%");
    // Away shot at (50, 75) is shown at (50, 25)
    expect(away.style.left).toBe("50%");
    expect(away.style.top).toBe("25%");
  });

  describe("interactive markers", () => {
    const onShotClick = vi.fn();
    const onShotMove = vi.fn();

    const renderInteractive = (variant: "full" | "half-top" = "full") =>
      render(
        <ShotMap
          onPitchClick={mockOnPitchClick}
          shots={mockShots}
          variant={variant}
          onShotClick={onShotClick}
          onShotMove={onShotMove}
        />,
      );

    beforeEach(() => {
      onShotClick.mockReset();
      onShotMove.mockReset();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders each marker as a labelled button with a 44px hit area", () => {
      renderInteractive();
      const marker = screen.getByRole("button", { name: /Open Play/ });
      expect(marker.className).toContain("h-11");
      expect(marker.className).toContain("w-11");
      // The visible dot keeps its size
      expect(marker.querySelector(".h-5.w-5")).not.toBeNull();
    });

    it("tapping a marker opens that shot and does not create a new one", () => {
      renderInteractive();
      fireEvent.click(screen.getByRole("button", { name: /Set Piece/ }));
      expect(onShotClick).toHaveBeenCalledWith(mockShots[1]);
      expect(mockOnPitchClick).not.toHaveBeenCalled();
    });

    it("passes the stored shot when tapping a mirrored marker", () => {
      renderInteractive("half-top");
      fireEvent.click(screen.getByRole("button", { name: /Set Piece/ }));
      expect(onShotClick).toHaveBeenCalledWith(mockShots[1]);
    });

    it("long-press then drag moves the shot to the drop point", () => {
      vi.useFakeTimers();
      renderInteractive();
      const marker = screen.getByRole("button", { name: /Open Play/ });

      longPressDrag(marker, { clientX: 30, clientY: 60 });

      expect(onShotMove).toHaveBeenCalledWith("1", 30, 60);
      expect(onShotClick).not.toHaveBeenCalled();
      expect(mockOnPitchClick).not.toHaveBeenCalled();
    });

    it("shows the marker lifted while dragging", () => {
      vi.useFakeTimers();
      renderInteractive();
      const marker = screen.getByRole("button", { name: /Open Play/ });
      fireEvent.pointerDown(marker, { pointerId: 1, clientX: 50, clientY: 25 });
      act(() => {
        vi.advanceTimersByTime(450);
      });
      fireEvent.pointerMove(marker, { pointerId: 1, clientX: 20, clientY: 40 });
      expect(marker.dataset.dragging).toBe("true");
      expect(marker.style.left).toBe("20%");
      expect(marker.style.top).toBe("40%");
      fireEvent.pointerUp(marker, { pointerId: 1, clientX: 20, clientY: 40 });
      expect(marker.dataset.dragging).toBeUndefined();
    });

    it("does not move on a short press, which stays a tap", () => {
      vi.useFakeTimers();
      renderInteractive();
      const marker = screen.getByRole("button", { name: /Open Play/ });
      fireEvent.pointerDown(marker, { pointerId: 1, clientX: 50, clientY: 25 });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      fireEvent.pointerMove(marker, { pointerId: 1, clientX: 80, clientY: 80 });
      fireEvent.pointerUp(marker, { pointerId: 1, clientX: 80, clientY: 80 });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(onShotMove).not.toHaveBeenCalled();
      expect(marker.dataset.dragging).toBeUndefined();
    });

    it("clamps drops outside the pitch to its edge", () => {
      vi.useFakeTimers();
      renderInteractive();
      longPressDrag(screen.getByRole("button", { name: /Open Play/ }), {
        clientX: 150,
        clientY: -20,
      });
      expect(onShotMove).toHaveBeenCalledWith("1", 100, 0);
    });

    it("keeps a mirrored shot where it was dropped in half view", () => {
      vi.useFakeTimers();
      renderInteractive("half-top");
      // The visible half maps 100px of height to y 0-50
      longPressDrag(screen.getByRole("button", { name: /Set Piece/ }), {
        clientX: 30,
        clientY: 40,
      });
      // Dropped at (30, 20) on screen; stored mirrored in the bottom half
      expect(onShotMove).toHaveBeenCalledWith("2", 70, 80);
    });
  });
});
