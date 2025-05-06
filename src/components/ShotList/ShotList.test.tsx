import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Shot } from "../../types/Shot";
import ShotList from "./ShotList";

describe("ShotList Component", () => {
  // Mock functions
  const mockOnRemoveShot = vi.fn();
  const mockOnClearAllShots = vi.fn();
  const mockOnImportShots = vi.fn();

  // Mock shots data
  const mockShots: Shot[] = [
    {
      id: "1",
      x: 30,
      y: 40,
      isGoal: true,
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
      bodyPart: "Head",
      shotType: "Set Piece",
      team: "away",
      timestamp: 1656789234567,
    },
  ];

  // Reset mocks before each test
  beforeEach(() => {
    mockOnRemoveShot.mockReset();
    mockOnClearAllShots.mockReset();
    mockOnImportShots.mockReset();

    // For export functionality, instead of mocking document.createElement,
    // let's create a simpler mock for the anchor click
    vi.spyOn(document, "createElement").mockClear();

    // Mock the anchor click method using a different approach
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === "a") {
        // Only mock the click method on anchor elements
        element.click = vi.fn();
      }
      return element;
    });

    return () => {
      // Restore original createElement
      document.createElement = originalCreateElement;
    };
  });

  it("renders empty state when no shots are provided", () => {
    render(
      <ShotList
        shots={[]}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
        onImportShots={mockOnImportShots}
      />,
    );

    // Check for empty state message
    expect(
      screen.getByText("No shots recorded yet. Click on the pitch to add one."),
    ).toBeTruthy();
    expect(
      screen.getByText("Or import a previously saved shot list:"),
    ).toBeTruthy();
    expect(screen.getByText("Import Shot List")).toBeTruthy();
  });

  it("renders shot list when shots are provided", () => {
    render(
      <ShotList
        shots={mockShots}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
      />,
    );

    // Check header shows correct count
    expect(
      screen.getByText(`Recorded Shots (${mockShots.length})`),
    ).toBeTruthy();

    // Check if shots are rendered correctly
    expect(screen.getByText(/goal/)).toBeTruthy();
    expect(screen.getByText(/miss/)).toBeTruthy();
    expect(screen.getByText(/Boström/)).toBeTruthy();
  });

  it("calls onRemoveShot when remove button is clicked", () => {
    render(
      <ShotList
        shots={mockShots}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
      />,
    );

    // Find the first remove button and click it
    const removeButtons = document.querySelectorAll(
      "[title='Remove this shot']",
    );
    fireEvent.click(removeButtons[0]);

    // Check if onRemoveShot was called with the correct ID
    expect(mockOnRemoveShot).toHaveBeenCalledWith(mockShots[0].id);
  });

  it("calls onClearAllShots when Clear All Shots button is clicked", () => {
    render(
      <ShotList
        shots={mockShots}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
        displayFilter="all"
      />,
    );

    // Find and click the clear all button
    const clearButton = screen.getByText("Clear All Shots");
    fireEvent.click(clearButton);

    // Check if onClearAllShots was called
    expect(mockOnClearAllShots).toHaveBeenCalled();
  });

  it("triggers export when Export Data button is clicked", () => {
    render(
      <ShotList
        shots={mockShots}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
        displayFilter="all"
      />,
    );

    // Find and click the export button
    const exportButton = screen.getByText("Export Data as JSON");
    fireEvent.click(exportButton);

    // Check if createElement was called with the right arguments
    expect(document.createElement).toHaveBeenCalledWith("a");
  });

  it("does not show export and clear buttons when displayFilter is not 'all'", () => {
    render(
      <ShotList
        shots={mockShots}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
        displayFilter="home"
      />,
    );

    // Buttons should not exist
    expect(screen.queryByText("Export Data as JSON")).toBeNull();
    expect(screen.queryByText("Clear All Shots")).toBeNull();
  });

  it("triggers file input when Import Shot List button is clicked in empty state", () => {
    render(
      <ShotList
        shots={[]}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
        onImportShots={mockOnImportShots}
      />,
    );

    // Mock click method for the file input
    const clickMock = vi.fn();
    HTMLInputElement.prototype.click = clickMock;

    // Find and click the import button
    const importButton = screen.getByText("Import Shot List");
    fireEvent.click(importButton);

    // Check if click was called on the file input
    expect(clickMock).toHaveBeenCalled();
  });

  it("calls onImportShots with valid data when file is imported", () => {
    render(
      <ShotList
        shots={[]}
        onRemoveShot={mockOnRemoveShot}
        onClearAllShots={mockOnClearAllShots}
        onImportShots={mockOnImportShots}
      />,
    );

    // Create a mock file and FileReader
    const mockFile = new File([JSON.stringify(mockShots)], "shots.json", {
      type: "application/json",
    });

    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      result: JSON.stringify(mockShots),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onload: null as any,
    };

    vi.spyOn(window, "FileReader").mockImplementation(
      () => mockFileReader as unknown as FileReader,
    );

    // Get the file input and simulate change
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Manually trigger the onload event since we mocked FileReader
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as unknown as Event);
    }

    // Check if onImportShots was called with the correct data
    expect(mockOnImportShots).toHaveBeenCalledWith(mockShots);
  });
});
