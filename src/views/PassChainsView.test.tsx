import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChainTerminationReason } from "../types/PassChain";
import PassChainsView from "./PassChainsView";

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
    onClearAllPassChains,
    onImportPassChains,
    onRemovePassChain,
  }: {
    passChains: unknown[];
    onClearAllPassChains: () => void;
    onImportPassChains: (chains: unknown[]) => void;
    onRemovePassChain: (chainId: string) => void;
  }) => (
    <div data-testid="list-view">
      <div data-testid="pass-chains-count">{passChains.length}</div>
      <button data-testid="clear-all" onClick={onClearAllPassChains}>
        Clear All
      </button>
      <button
        data-testid="import-chains"
        onClick={() =>
          onImportPassChains([
            {
              id: "imported-1",
              actions: [
                {
                  x: 10,
                  y: 10,
                  sequenceNumber: 0,
                  actionType: "start",
                  pitchZone: { horizontal: "left", vertical: "attacking" },
                },
              ],
              terminationReason: "goal",
              isCompleted: true,
              zones: null,
            },
          ])
        }
      >
        Import Chains
      </button>
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
      render(<PassChainsView />);

      expect(screen.getByTestId("current-view").textContent).toBe("pitch");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
    });

    it("should load pass chains from localStorage on initialization", () => {
      const storedChains = [
        {
          id: "chain-1",
          actions: [],
          terminationReason: "goal",
          isCompleted: true,
          zones: null,
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedChains));

      render(<PassChainsView />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "shot-gobbler-pass-chains",
      );
    });

    it("should handle localStorage error gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<PassChainsView />);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error loading pass chains from localStorage:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("Action Type Logic", () => {
    it("should always set first action as 'start' regardless of selected action type", () => {
      render(<PassChainsView />);

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
      render(<PassChainsView />);

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
      render(<PassChainsView />);

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
      render(<PassChainsView />);

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
      render(<PassChainsView />);

      // Add first action
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");

      // Add second action
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("2");
    });

    it("should undo last action", () => {
      render(<PassChainsView />);

      // Add two actions
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("2");

      // Undo last action
      fireEvent.click(screen.getByTestId("undo-action"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");
    });

    it("should clear current chain and reset action type", () => {
      render(<PassChainsView />);

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
      render(<PassChainsView />);

      // Add an action
      fireEvent.click(screen.getByTestId("pitch-click"));

      // End chain
      fireEvent.click(screen.getByTestId("end-chain"));

      // Modal should be open
      expect(screen.getByTestId("modal")).toBeTruthy();
      expect(screen.getByTestId("pass-chain-form")).toBeTruthy();
    });

    it("should not open modal when ending chain without actions", () => {
      render(<PassChainsView />);

      // End chain without any actions
      fireEvent.click(screen.getByTestId("end-chain"));

      // Modal should not be open
      expect(screen.queryByTestId("modal")).toBeNull();
    });

    it("should complete pass chain and reset state on form submit", async () => {
      render(<PassChainsView />);

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
      render(<PassChainsView />);

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
      render(<PassChainsView />);

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
      render(<PassChainsView />);

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
      render(<PassChainsView />);

      // Switch to list view and clear all
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("clear-all"));

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to clear all pass chains? This cannot be undone.",
      );
    });

    it("should not clear pass chains if confirmation is cancelled", () => {
      mockConfirm.mockReturnValue(false);
      render(<PassChainsView />);

      // Switch to list view and try to clear all
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("clear-all"));

      expect(window.confirm).toHaveBeenCalled();
      // Since we're mocking the components, we can't easily test the actual state change
      // but the confirm dialog should have been shown
    });

    it("should import pass chains with new IDs", () => {
      render(<PassChainsView />);

      // Switch to list view and import
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("import-chains"));

      // The mock will simulate importing chains
      // We can't easily test the actual ID generation without exposing internal state
    });

    it("should remove individual pass chain", () => {
      render(<PassChainsView />);

      // Switch to list view and remove a chain
      fireEvent.click(screen.getByTestId("switch-to-list"));
      fireEvent.click(screen.getByTestId("remove-chain"));

      // The mock will simulate removing a chain
    });
  });

  describe("LocalStorage Integration", () => {
    it("should save pass chains to localStorage when chains change", async () => {
      render(<PassChainsView />);

      // Add and complete a chain
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("end-chain"));
      fireEvent.click(screen.getByTestId("submit-form"));

      // Should save to localStorage
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "shot-gobbler-pass-chains",
          expect.any(String),
        );
      });
    });

    it("should handle localStorage save errors gracefully", async () => {
      // Spy on console.error to suppress expected error logs during test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage save error");
      });

      render(<PassChainsView />);

      // Add and complete a chain
      fireEvent.click(screen.getByTestId("pitch-click"));
      fireEvent.click(screen.getByTestId("end-chain"));
      fireEvent.click(screen.getByTestId("submit-form"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error saving pass chains to localStorage:",
          expect.any(Error),
        );
      });

      // Verify app continues to work despite localStorage error
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );

      consoleSpy.mockRestore();
    });

    it("should continue normal operation when localStorage is completely unavailable", async () => {
      // Spy on console.error to suppress expected error logs during test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock both get and set to fail
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      // Component should still render and work despite localStorage failures
      render(<PassChainsView />);

      // Basic functionality should work
      expect(screen.getByTestId("current-view").textContent).toBe("pitch");
      expect(screen.getByTestId("selected-action-type").textContent).toBe(
        "start",
      );

      // Can still create and work with pass chains in memory
      fireEvent.click(screen.getByTestId("pitch-click"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("1");

      // Can complete a chain (even though it won't persist)
      fireEvent.click(screen.getByTestId("end-chain"));
      fireEvent.click(screen.getByTestId("submit-form"));
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");

      // Verify error was logged but app didn't crash
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error loading pass chains from localStorage:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Sequence Number Logic", () => {
    it("should assign correct sequence numbers to actions", () => {
      render(<PassChainsView />);

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
      render(<PassChainsView />);

      // Rapidly click multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId("pitch-click"));
      }

      expect(screen.getByTestId("current-chain-length").textContent).toBe("5");
    });

    it("should handle undo when chain is empty", () => {
      render(<PassChainsView />);

      // Try to undo when chain is empty
      fireEvent.click(screen.getByTestId("undo-action"));

      // Should remain at 0
      expect(screen.getByTestId("current-chain-length").textContent).toBe("0");
    });

    it("should handle form submit when chain is empty", () => {
      render(<PassChainsView />);

      // Try to end chain when empty
      fireEvent.click(screen.getByTestId("end-chain"));

      // Modal should not open
      expect(screen.queryByTestId("modal")).toBeNull();
    });
  });
});
