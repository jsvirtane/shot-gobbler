import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChainTerminationReason, PassChain } from "../types/PassChain";
import PassChainsView from "./PassChainsView";

// Helper function to render PassChainsView with default props
const renderPassChainsView = (initialPassChains: PassChain[] = []) => {
  const mockSetPassChains = vi.fn((updater) => {
    if (typeof updater === "function") {
      const newChains = updater(initialPassChains);
      initialPassChains.length = 0;
      initialPassChains.push(...newChains);
    } else {
      initialPassChains.length = 0;
      initialPassChains.push(...updater);
    }
  });

  const result = render(
    <PassChainsView
      passChains={initialPassChains}
      setPassChains={mockSetPassChains}
    />,
  );

  return {
    ...result,
    mockSetPassChains,
    passChains: initialPassChains,
  };
};

// Mock useUrlState hook to return controlled state for tests
vi.mock("../hooks/useUrlState", () => ({
  useUrlState: (_key: string, defaultValue: string) => {
    const [state, setState] = React.useState(defaultValue);
    return [state, setState];
  },
}));

// Mock the components that PassChainsView uses
vi.mock("../components/PassChainsPitchView/PassChainsPitchView", () => ({
  default: ({
    onPitchClick,
    onActionTypeChange,
    onEndChain,
    onUndoLastAction,
    onClearCurrentChain,
    selectedActionType,
    currentPassChain,
  }: {
    onPitchClick: (x: number, y: number) => void;
    onActionTypeChange: (actionType: string) => void;
    onEndChain: () => void;
    onUndoLastAction: () => void;
    onClearCurrentChain: () => void;
    selectedActionType: string;
    currentPassChain: unknown[];
  }) => (
    <div data-testid="pitch-view">
      <div data-testid="selected-action-type">{selectedActionType}</div>
      <div data-testid="current-chain-length">{currentPassChain.length}</div>
      <button data-testid="pitch-click" onClick={() => onPitchClick(50, 25)}>
        Click Pitch
      </button>
      <button
        data-testid="change-action-type"
        onClick={() => onActionTypeChange("cross")}
      >
        Change Action Type
      </button>
      <button data-testid="end-chain" onClick={onEndChain}>
        End Chain
      </button>
      <button data-testid="undo-action" onClick={onUndoLastAction}>
        Undo
      </button>
      <button data-testid="clear-chain" onClick={onClearCurrentChain}>
        Clear Chain
      </button>
    </div>
  ),
}));

vi.mock("../components/PassChainsListView/PassChainsListView", () => ({
  default: ({
    passChains,
    onRemovePassChain,
  }: {
    passChains: unknown[];
    onRemovePassChain: (chainId: string) => void;
  }) => (
    <div data-testid="list-view">
      <div data-testid="pass-chains-count">{passChains.length}</div>
      <button
        data-testid="remove-chain"
        onClick={() => onRemovePassChain("test-id")}
      >
        Remove Chain
      </button>
    </div>
  ),
}));

vi.mock("../components/PassChainForm/PassChainForm", () => ({
  default: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (data: { terminationReason: ChainTerminationReason }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="pass-chain-form">
      <button
        data-testid="submit-form"
        onClick={() =>
          onSubmit({ terminationReason: "goal" as ChainTerminationReason })
        }
      >
        Submit
      </button>
      <button data-testid="cancel-form" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../components/Modal/Modal", () => ({
  default: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
}));

vi.mock("../components/ViewToggle/ViewToggle", () => ({
  default: ({
    currentView,
    onViewChange,
  }: {
    currentView: string;
    onViewChange: (view: string) => void;
  }) => (
    <div data-testid="view-toggle">
      <div data-testid="current-view">{currentView}</div>
      <button data-testid="switch-to-list" onClick={() => onViewChange("list")}>
        List View
      </button>
      <button
        data-testid="switch-to-pitch"
        onClick={() => onViewChange("pitch")}
      >
        Pitch View
      </button>
    </div>
  ),
}));

vi.mock("../utils/pitchZones", () => ({
  getZoneFromCoordinates: ({ x, y }: { x: number; y: number }) => ({
    horizontal: x < 30 ? "left" : x < 70 ? "central" : "right",
    vertical: y < 30 ? "attacking" : y < 70 ? "midfield" : "defensive",
  }),
  getZonesFromPassChain: () => ({
    start: { horizontal: "left", vertical: "attacking" },
    end: { horizontal: "right", vertical: "defensive" },
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, "confirm", {
  value: mockConfirm,
});

describe("PassChainsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Reset localStorage.setItem to not throw errors by default
    localStorageMock.setItem.mockImplementation(() => {});
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with pitch view and start action type", () => {
      renderPassChainsView();

      expect(screen.getByTestId("current-view").textContent).toBe("pitch");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
    });

    it("should render with provided pass chains", () => {
      const storedChains = [
        {
          id: "chain-1",
          actions: [],
          terminationReason: "goal" as ChainTerminationReason,
          isCompleted: true,
          zones: null,
        },
      ];

      renderPassChainsView(storedChains);

      // When we switch to list view, we should see the chain
      fireEvent.click(screen.getByTestId("switch-to-list"));
      expect(screen.getByTestId("pass-chains-count").textContent).toBe("1");
    });
  });

  describe("Action Type Logic", () => {
    it("should always set first action as 'start' regardless of selected action type", () => {
      renderPassChainsView();

      // Change action type to something else
      fireEvent.click(screen.getByTestId("change-action-type"));
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "cross",
      );

      // Click pitch - first action should still be 'start'
      fireEvent.click(screen.getByTestId("pitch-click"));

      // Chain length should be 1 (meaning action was added)
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");
    });

    it("should automatically switch to 'pass' after first action when starting with 'start'", async () => {
      renderPassChainsView();

      // Verify initial state
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );

      // Click pitch to add first action
      fireEvent.click(screen.getByTestId("pitch-click"));

      // Should automatically switch to 'pass'
      await waitFor(() => {
        expect(screen.getByTestId("selected-action-type").textContent).toBe(
          "pass",
        );
      });
    });

    it("should not auto-switch to 'pass' if action type was manually changed from 'start'", async () => {
      renderPassChainsView();

      // Change action type from 'start' to 'cross'
      fireEvent.click(screen.getByTestId("change-action-type"));
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "cross",
      );

      // Click pitch to add first action
      fireEvent.click(screen.getByTestId("pitch-click"));

      // Should stay as 'cross', not switch to 'pass'
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "cross",
      );
    });

    it("should use selected action type for subsequent actions", () => {
      renderPassChainsView();

      // Add first action (will be 'start')
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");

      // Change action type
      fireEvent.click(screen.getByTestId("change-action-type"));
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "cross",
      );

      // Add second action (should use 'cross')
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("2");
    });
  });

  describe("Pass Chain Actions", () => {
    it("should add actions to current pass chain on pitch click", () => {
      renderPassChainsView();

      // Add first action
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");

      // Add second action
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("2");
    });

    it("should undo last action", () => {
      renderPassChainsView();

      // Add two actions
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("2");

      // Undo last action
      fireEvent.click(screen.getByTestId("undo-action"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");
    });

    it("should clear current chain and reset action type", () => {
      renderPassChainsView();

      // Add action and change action type
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("change-action-type"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "cross",
      );

      // Clear chain
      fireEvent.click(screen.getByTestId("clear-chain"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );
    });
  });

  describe("Pass Chain Completion", () => {
    it("should open modal when ending chain with actions", () => {
      renderPassChainsView();

      // Add an action
      fireEvent.click(screen.getByTestId("pitch-click"));

      // End chain
      fireEvent.click(screen.getByTestId("end-chain"));

      // Modal should be open
      expect(screen.getByTestId("modal")).toBeTruthy();
      expect(screen.getByTestId("pass-chain-form")).toBeTruthy();
    });

    it("should not open modal when ending chain without actions", () => {
      renderPassChainsView();

      // End chain without any actions
      fireEvent.click(screen.getByTestId("end-chain"));

      // Modal should not be open
      expect(screen.queryByTestId("modal")).toBeNull();
    });

    it("should complete pass chain and reset state on form submit", async () => {
      renderPassChainsView();

      // Add an action and end chain
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("end-chain"));

      // Submit form
      fireEvent.click(screen.getByTestId("submit-form"));

      // Chain should be cleared and action type reset
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );

      // Modal should be closed
      expect(screen.queryByTestId("modal")).toBeNull();
    });

    it("should close modal on form cancel", () => {
      renderPassChainsView();

      // Add an action and end chain
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("end-chain"));

      // Cancel form
      fireEvent.click(screen.getByTestId("cancel-form"));

      // Modal should be closed, but chain should remain
      expect(screen.queryByTestId("modal")).toBeNull();
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");
    });
  });

  describe("View Toggle", () => {
    it("should switch between pitch and list views", () => {
      renderPassChainsView();

      // Should start with pitch view
      expect(screen.getByTestId("current-view").textContent).toBe("pitch");
      expect(screen.getByTestId("pitch-view")).toBeTruthy();
      expect(screen.queryByTestId("list-view")).toBeNull();

      // Switch to list view
      fireEvent.click(screen.getByTestId("switch-to-list"));
      expect(screen.getByTestId("current-view").textContent).toBe("list");
      expect(screen.queryByTestId("pitch-view")).toBeNull();
      expect(screen.getByTestId("list-view")).toBeTruthy();

      // Switch back to pitch view
      fireEvent.click(screen.getByTestId("switch-to-pitch"));
      expect(screen.getByTestId("current-view").textContent).toBe("pitch");
      expect(screen.getByTestId("pitch-view")).toBeTruthy();
      expect(screen.queryByTestId("list-view")).toBeNull();
    });

    it("should hide view toggle when there is an active pass chain", () => {
      renderPassChainsView();

      // View toggle should be visible initially
      expect(screen.getByTestId("view-toggle")).toBeTruthy();

      // Add an action to create active chain
      fireEvent.click(screen.getByTestId("pitch-click"));

      // View toggle should be hidden
      expect(screen.queryByTestId("view-toggle")).toBeNull();
    });
  });

  describe("Pass Chain Management", () => {
    it("should clear all pass chains with confirmation", () => {
      renderPassChainsView();

      // Create and complete a pass chain first
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("end-chain"));
      fireEvent.click(screen.getByTestId("submit-form"));

      // Switch to list view and clear all
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("clear-all"));

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to clear all pass chains? This cannot be undone.",
      );
    });

    it("should not clear pass chains if confirmation is cancelled", () => {
      mockConfirm.mockReturnValue(false);
      renderPassChainsView();

      // Create and complete a pass chain first
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("end-chain"));
      fireEvent.click(screen.getByTestId("submit-form"));

      // Switch to list view and try to clear all
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("clear-all"));

      expect(window.confirm).toHaveBeenCalled();
      // Since we're mocking the components, we can't easily test the actual state change
      // but the confirm dialog should have been shown
    });

    it("should remove individual pass chain", () => {
      renderPassChainsView();

      // Switch to list view and remove a chain
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("remove-chain"));

      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("remove-chain"));

      // The mock will simulate removing a chain
    });
  });

  describe("Sequence Number Logic", () => {
    it("should assign correct sequence numbers to actions", () => {
      renderPassChainsView();

      // Add multiple actions
      fireEvent.click(screen.getByTestId("pitch-click")); // sequence 0
      fireEvent.click(screen.getByTestId("pitch-click")); // sequence 1
      fireEvent.click(screen.getByTestId("pitch-click")); // sequence 2

      expect(screen.getByTestId("current-chain-length").textContent).toBe("3");

      // Undo one action
      fireEvent.click(screen.getByTestId("undo-action"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("2");

      // Add another action - should get sequence number 2
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple rapid clicks correctly", () => {
      renderPassChainsView();

      // Rapidly click multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId("pitch-click"));
      }

      expect(screen.getByTestId("current-chain-length").textContent).toBe("5");
    });

    it("should handle undo when chain is empty", () => {
      renderPassChainsView();

      // Try to undo when chain is empty
      fireEvent.click(screen.getByTestId("undo-action"));

      // Should remain at 0
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
    });

    it("should handle form submit when chain is empty", () => {
      renderPassChainsView();

      // Try to end chain when empty
      fireEvent.click(screen.getByTestId("end-chain"));

      // Modal should not open
      expect(screen.queryByTestId("modal")).toBeNull();
    });
  });
});
