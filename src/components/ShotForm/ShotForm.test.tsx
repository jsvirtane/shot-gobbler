import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Team } from "../../types/common";
import ShotForm from "./ShotForm";

describe("ShotForm Component", () => {
  // Mock functions and default props
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    initialCoords: { x: 50, y: 25 },
    defaultTeam: "home" as Team,
  };

  // Reset mocks before each test
  beforeEach(() => {
    mockOnClose.mockReset();
    mockOnSubmit.mockReset();
  });

  it("renders when isOpen is true", () => {
    render(<ShotForm {...defaultProps} />);

    // Check if the form title is rendered
    expect(screen.getByText("New Shot")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "New Shot" })).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    render(<ShotForm {...defaultProps} isOpen={false} />);

    // Check if the form is not in the document
    expect(screen.queryByText("New Shot")).toBeNull();
  });

  it("updates team when team buttons are clicked", () => {
    render(<ShotForm {...defaultProps} />);

    // Should start with home team selected
    const homeButton = screen.getByText("🏠 Home");
    const awayButton = screen.getByText("🚌 Away");

    expect(homeButton.className).toContain("bg-blue-600");
    expect(awayButton.className).toContain("bg-gray-200");

    // Click away team
    fireEvent.click(awayButton);

    // Now away button should be selected
    expect(homeButton.className).toContain("bg-gray-200");
    expect(awayButton.className).toContain("bg-blue-600");
  });

  it("updates isGoal when result buttons are clicked", () => {
    render(<ShotForm {...defaultProps} />);

    // Should start with Miss selected
    const missButton = screen.getByText("❌ Miss");
    const goalButton = screen.getByText("⚽ Goal");

    expect(missButton.className).toContain("bg-blue-600");
    expect(goalButton.className).toContain("bg-gray-200");

    // Click Goal
    fireEvent.click(goalButton);

    // Now Goal should be selected
    expect(missButton.className).toContain("bg-gray-200");
    expect(goalButton.className).toContain("bg-blue-600");
  });

  it("updates bodyPart when body part buttons are clicked", () => {
    render(<ShotForm {...defaultProps} />);

    // Should start with Foot selected
    const footButton = screen.getByText("👟 Foot");
    const headButton = screen.getByText("👤 Head");
    const otherButton = screen.getByText("🦵 Other");

    expect(footButton.className).toContain("bg-blue-600");

    // Click Head
    fireEvent.click(headButton);
    expect(footButton.className).toContain("bg-gray-200");
    expect(headButton.className).toContain("bg-blue-600");

    // Click Other
    fireEvent.click(otherButton);
    expect(headButton.className).toContain("bg-gray-200");
    expect(otherButton.className).toContain("bg-blue-600");
  });

  it("updates shotType when shot type buttons are clicked", () => {
    render(<ShotForm {...defaultProps} />);

    // Should start with Open Play selected
    const openPlayButton = screen.getByText("Open Play");
    const setPieceButton = screen.getByText("Set Piece");
    const penaltyButton = screen.getByText("Penalty");

    expect(openPlayButton.className).toContain("bg-blue-600");

    // Click Set Piece
    fireEvent.click(setPieceButton);
    expect(openPlayButton.className).toContain("bg-gray-200");
    expect(setPieceButton.className).toContain("bg-blue-600");

    // Click Penalty
    fireEvent.click(penaltyButton);
    expect(setPieceButton.className).toContain("bg-gray-200");
    expect(penaltyButton.className).toContain("bg-blue-600");
  });

  it("updates playerName when input changes", () => {
    render(<ShotForm {...defaultProps} />);

    const playerNameInput = screen.getByPlaceholderText(
      "e.g., Ronaldo or 7",
    ) as HTMLInputElement;

    // Check initial empty state
    expect(playerNameInput.value).toBe("");

    // Type in player name
    fireEvent.change(playerNameInput, { target: { value: "Helen" } });

    // Check updated value
    expect(playerNameInput.value).toBe("Helen");
  });

  it("calls onSubmit with correct data when Add Shot is clicked", () => {
    render(<ShotForm {...defaultProps} />);

    // Customize some values
    fireEvent.click(screen.getByText("🚌 Away")); // Switch to away team
    fireEvent.click(screen.getByText("⚽ Goal")); // Set as goal
    fireEvent.click(screen.getByText("👤 Head")); // Set body part to head
    fireEvent.click(screen.getByText("Penalty")); // Set shot type to penalty

    fireEvent.change(screen.getByPlaceholderText("e.g., Ronaldo or 7"), {
      target: { value: "Pippola" },
    });

    // Click Add Shot button
    fireEvent.click(screen.getByText("Add Shot"));

    // Check if onSubmit is called with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      x: 50,
      y: 25,
      isGoal: true,
      result: "Goal",
      bodyPart: "Head",
      shotType: "Penalty",
      team: "away",
      playerName: "Pippola",
    });

    // Check if onClose is called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<ShotForm {...defaultProps} />);

    // Click Cancel button
    fireEvent.click(screen.getByText("Cancel"));

    // onClose should be called
    expect(mockOnClose).toHaveBeenCalled();
    // onSubmit should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("trims playerName and converts empty strings to undefined", () => {
    render(<ShotForm {...defaultProps} />);

    // Add spaces in player name
    fireEvent.change(screen.getByPlaceholderText("e.g., Ronaldo or 7"), {
      target: { value: "Muzaci " },
    });

    // Click Add Shot button
    fireEvent.click(screen.getByText("Add Shot"));

    // Check if playerName is undefined in submitted data
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        playerName: "Muzaci",
      }),
    );
  });

  it("resets form to defaults when reopened", () => {
    const { rerender } = render(<ShotForm {...defaultProps} isOpen={false} />);

    // Change props to reopen the form
    rerender(<ShotForm {...defaultProps} isOpen={true} />);

    // Check if default buttons are selected
    expect(screen.getByText("🏠 Home").className).toContain("bg-blue-600");
    expect(screen.getByText("❌ Miss").className).toContain("bg-blue-600");
    expect(screen.getByText("👟 Foot").className).toContain("bg-blue-600");
    expect(screen.getByText("Open Play").className).toContain("bg-blue-600");

    // Cast to HTMLInputElement for proper type checking
    const playerNameInput = screen.getByPlaceholderText(
      "e.g., Ronaldo or 7",
    ) as HTMLInputElement;
    expect(playerNameInput.value).toBe("");
  });

  it("pre-selects remembered choices but always starts the result at Miss", () => {
    const { rerender } = render(<ShotForm {...defaultProps} isOpen={false} />);
    rerender(
      <ShotForm
        {...defaultProps}
        defaultTeam="away"
        defaultBodyPart="Head"
        defaultShotType="Penalty"
        defaultPlayerName="10"
      />,
    );

    expect(screen.getByText("🚌 Away").className).toContain("bg-blue-600");
    expect(screen.getByText("👤 Head").className).toContain("bg-blue-600");
    expect(screen.getByText("Penalty").className).toContain("bg-blue-600");
    expect(screen.getByText("❌ Miss").className).toContain("bg-blue-600");
    expect(
      (screen.getByPlaceholderText("e.g., Ronaldo or 7") as HTMLInputElement)
        .value,
    ).toBe("10");
  });

  it("uses defaultTeam prop for initial team value", () => {
    render(<ShotForm {...defaultProps} defaultTeam="away" />);

    // Away button should be selected initially
    expect(screen.getByText("🚌 Away").className).toContain("bg-blue-600");
    expect(screen.getByText("🏠 Home").className).toContain("bg-gray-200");
  });
});
