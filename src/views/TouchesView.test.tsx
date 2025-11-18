import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Action } from "../types/Action";
import TouchesView from "./TouchesView";

// Mock the child components
vi.mock("../components/TouchMap/TouchMap", () => ({
  default: () => <div data-testid="touch-map">Touch Map</div>,
}));

vi.mock("../components/TouchList/TouchList", () => ({
  TouchList: ({
    actions,
    onRemoveAction,
  }: {
    actions: Action[];
    onRemoveAction: (id: string) => void;
  }) => (
    <div data-testid="touch-list">
      <div data-testid="actions-count">{actions.length}</div>
      {actions.map((action) => (
        <div key={action.id} data-testid={`action-${action.id}`}>
          <button onClick={() => onRemoveAction(action.id)}>Remove</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../components/ActionForm/ActionForm", () => ({
  default: () => <div data-testid="action-form">Action Form</div>,
}));

vi.mock("../components/ViewToggle/ViewToggle", () => ({
  default: () => <div data-testid="view-toggle">View Toggle</div>,
}));

vi.mock("../components/Modal/Modal", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal">{children}</div>
  ),
}));

// Mock useUrlState hook
vi.mock("../hooks/useUrlState", () => ({
  useUrlState: (key: string, defaultValue: string) => {
    // Return "list" view to make Clear All button visible
    if (key === "view") {
      return ["list", vi.fn()];
    }
    return [defaultValue, vi.fn()];
  },
}));

import React from "react";

describe("TouchesView", () => {
  const mockSetActions = vi.fn();
  const mockConfirm = vi.spyOn(window, "confirm");

  beforeEach(() => {
    mockSetActions.mockClear();
    mockConfirm.mockClear();
    mockConfirm.mockReturnValue(true);
  });

  describe("Clear All Actions", () => {
    it("should show Clear All button when actions exist", () => {
      const mockActions: Action[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          category: "attacking",
          actionType: "pass",
          outcome: "successful",
          timestamp: Date.now(),
        },
      ];

      render(<TouchesView actions={mockActions} setActions={mockSetActions} />);

      // The Clear All button should be visible
      expect(screen.queryByText(/Clear All/i)).toBeTruthy();
    });

    it("should not show Clear All button when no actions exist", () => {
      render(<TouchesView actions={[]} setActions={mockSetActions} />);

      // The Clear All button should not be visible
      expect(screen.queryByText(/Clear All/i)).toBeNull();
    });

    it("should clear all actions when Clear All button is clicked and confirmed", () => {
      const mockActions: Action[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          category: "attacking",
          actionType: "pass",
          outcome: "successful",
          timestamp: Date.now(),
        },
        {
          id: "2",
          x: 50,
          y: 20,
          category: "attacking",
          actionType: "shot",
          outcome: "off-target",
          timestamp: Date.now(),
        },
      ];

      mockConfirm.mockReturnValue(true);
      render(<TouchesView actions={mockActions} setActions={mockSetActions} />);

      const clearButton = screen.getByText(/Clear All/i);
      fireEvent.click(clearButton);

      // Confirmation dialog should be shown
      expect(mockConfirm).toHaveBeenCalledWith(
        "Are you sure you want to clear all actions? This cannot be undone.",
      );

      // setActions should be called with empty array
      expect(mockSetActions).toHaveBeenCalledWith([]);
    });

    it("should not clear actions when Clear All is cancelled", () => {
      const mockActions: Action[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          category: "attacking",
          actionType: "pass",
          outcome: "successful",
          timestamp: Date.now(),
        },
      ];

      mockConfirm.mockReturnValue(false);
      render(<TouchesView actions={mockActions} setActions={mockSetActions} />);

      const clearButton = screen.getByText(/Clear All/i);
      fireEvent.click(clearButton);

      // Confirmation dialog should be shown
      expect(mockConfirm).toHaveBeenCalled();

      // setActions should NOT be called
      expect(mockSetActions).not.toHaveBeenCalled();
    });
  });

  describe("Action Removal", () => {
    it("should remove individual action when remove button is clicked", () => {
      const mockActions: Action[] = [
        {
          id: "1",
          x: 30,
          y: 40,
          category: "attacking",
          actionType: "pass",
          outcome: "successful",
          timestamp: Date.now(),
        },
        {
          id: "2",
          x: 50,
          y: 20,
          category: "attacking",
          actionType: "shot",
          outcome: "off-target",
          timestamp: Date.now(),
        },
      ];

      render(<TouchesView actions={mockActions} setActions={mockSetActions} />);

      // Find and click remove button for first action
      const removeButton = screen.getAllByText(/Remove/i)[0];
      fireEvent.click(removeButton);

      // setActions should be called with a function
      expect(mockSetActions).toHaveBeenCalled();

      // Get the updater function that was passed to setActions
      const updaterFn = mockSetActions.mock.calls[0][0];
      const newActions = updaterFn(mockActions);

      // Should only have the second action remaining
      expect(newActions).toHaveLength(1);
      expect(newActions[0].id).toBe("2");
    });
  });
});
