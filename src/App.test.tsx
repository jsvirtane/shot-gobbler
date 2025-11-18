import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Mock the view components
vi.mock("./views/DocsView", () => ({
  default: () => <div data-testid="docs-view">Docs View</div>,
}));

vi.mock("./views/ShotsView", () => ({
  default: () => <div data-testid="shots-view">Shots View</div>,
}));

vi.mock("./views/TouchesView", () => ({
  default: () => <div data-testid="touches-view">Touches View</div>,
}));

vi.mock("./views/PassChainsView", () => ({
  default: () => <div data-testid="pass-chains-view">Pass Chains View</div>,
}));

// Mock NavBar to expose tab switching functionality
vi.mock("./components/NavBar/NavBar", () => ({
  default: ({
    activeTab,
    setActiveTab,
  }: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
  }) => (
    <nav data-testid="navbar">
      <div data-testid="active-tab">{activeTab}</div>
      <button data-testid="nav-docs" onClick={() => setActiveTab("docs")}>
        Docs
      </button>
      <button data-testid="nav-shots" onClick={() => setActiveTab("shots")}>
        Shots
      </button>
      <button data-testid="nav-touches" onClick={() => setActiveTab("touches")}>
        Touches
      </button>
      <button
        data-testid="nav-pass-chains"
        onClick={() => setActiveTab("pass-chains")}
      >
        Pass Chains
      </button>
    </nav>
  ),
}));

// Mock ShareButton
vi.mock("./components/ShareButton", () => ({
  default: () => <div data-testid="share-button">Share</div>,
}));

describe("App - URL State Management", () => {
  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState({}, "", "/");
  });

  describe("Tab Navigation", () => {
    it("should default to docs tab when no URL parameter exists", () => {
      render(<App />);

      expect(screen.getByTestId("active-tab").textContent).toBe("docs");
      expect(screen.getByTestId("docs-view")).toBeTruthy();
    });

    it("should load correct tab from URL parameter", () => {
      window.history.replaceState({}, "", "/?tab=shots");

      render(<App />);

      expect(screen.getByTestId("active-tab").textContent).toBe("shots");
      expect(screen.getByTestId("shots-view")).toBeTruthy();
    });

    it("should update URL when switching tabs", () => {
      render(<App />);

      fireEvent.click(screen.getByTestId("nav-shots"));

      expect(window.location.search).toBe("?tab=shots");
      expect(screen.getByTestId("active-tab").textContent).toBe("shots");
    });

    it("should remove tab parameter when switching to docs", () => {
      window.history.replaceState({}, "", "/?tab=shots");

      render(<App />);

      fireEvent.click(screen.getByTestId("nav-docs"));

      expect(window.location.search).toBe("");
      expect(screen.getByTestId("active-tab").textContent).toBe("docs");
    });
  });

  describe("View Parameter Cleanup", () => {
    it("should clear view parameter when switching tabs", () => {
      window.history.replaceState({}, "", "/?tab=shots&view=list");

      render(<App />);

      fireEvent.click(screen.getByTestId("nav-touches"));

      expect(window.location.search).toBe("?tab=touches");
      expect(window.location.search).not.toContain("view=list");
    });

    it("should clear filter parameter when switching tabs", () => {
      window.history.replaceState({}, "", "/?tab=shots&filter=home");

      render(<App />);

      fireEvent.click(screen.getByTestId("nav-pass-chains"));

      expect(window.location.search).toBe("?tab=pass-chains");
      expect(window.location.search).not.toContain("filter=home");
    });

    it("should clear both view and filter parameters when switching tabs", () => {
      window.history.replaceState({}, "", "/?tab=shots&view=list&filter=away");

      render(<App />);

      fireEvent.click(screen.getByTestId("nav-touches"));

      expect(window.location.search).toBe("?tab=touches");
      expect(window.location.search).not.toContain("view=list");
      expect(window.location.search).not.toContain("filter=away");
    });

    it("should clear view and filter when switching to docs", () => {
      window.history.replaceState({}, "", "/?tab=shots&view=list&filter=home");

      render(<App />);

      fireEvent.click(screen.getByTestId("nav-docs"));

      expect(window.location.search).toBe("");
    });
  });

  describe("Share Button Visibility", () => {
    it("should not show share button on docs tab", () => {
      render(<App />);

      expect(screen.queryByTestId("share-button")).toBeFalsy();
    });

    it("should show share button on shots tab", () => {
      window.history.replaceState({}, "", "/?tab=shots");

      render(<App />);

      expect(screen.getByTestId("share-button")).toBeTruthy();
    });

    it("should show share button on touches tab", () => {
      window.history.replaceState({}, "", "/?tab=touches");

      render(<App />);

      expect(screen.getByTestId("share-button")).toBeTruthy();
    });

    it("should show share button on pass-chains tab", () => {
      window.history.replaceState({}, "", "/?tab=pass-chains");

      render(<App />);

      expect(screen.getByTestId("share-button")).toBeTruthy();
    });
  });

  describe("Tab Switching Sequence", () => {
    it("should handle multiple tab switches correctly", () => {
      render(<App />);

      // Start at docs
      expect(window.location.search).toBe("");

      // Switch to shots
      fireEvent.click(screen.getByTestId("nav-shots"));
      expect(window.location.search).toBe("?tab=shots");

      // Switch to touches
      fireEvent.click(screen.getByTestId("nav-touches"));
      expect(window.location.search).toBe("?tab=touches");

      // Switch to pass-chains
      fireEvent.click(screen.getByTestId("nav-pass-chains"));
      expect(window.location.search).toBe("?tab=pass-chains");

      // Switch back to docs
      fireEvent.click(screen.getByTestId("nav-docs"));
      expect(window.location.search).toBe("");
    });

    it("should maintain parameter cleanup across multiple switches", () => {
      window.history.replaceState({}, "", "/?tab=shots&view=list&filter=home");

      render(<App />);

      // Switch to touches (should clear view and filter)
      fireEvent.click(screen.getByTestId("nav-touches"));
      expect(window.location.search).toBe("?tab=touches");

      // Manually add view parameter back
      window.history.replaceState({}, "", "/?tab=touches&view=list");

      // Switch to pass-chains (should clear view)
      fireEvent.click(screen.getByTestId("nav-pass-chains"));
      expect(window.location.search).toBe("?tab=pass-chains");
      expect(window.location.search).not.toContain("view=list");
    });
  });
});

describe("App - LocalStorage Persistence", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Replace global localStorage with our mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    // Clear storage before each test
    localStorageMock.clear();
    // Reset URL
    window.history.replaceState({}, "", "/");
  });

  it("should initialize with empty arrays when localStorage is empty", () => {
    render(<App />);

    // After initialization, empty arrays are saved to localStorage
    // This is expected behavior - the app initializes with empty state and persists it
    expect(localStorageMock.getItem("shot-gobbler-data")).toBe("[]");
    expect(localStorageMock.getItem("shot-gobbler-touches-data")).toBe("[]");
    expect(localStorageMock.getItem("shot-gobbler-pass-chains")).toBe("[]");
  });

  it("should load shots from localStorage on initialization", () => {
    const mockShots = [
      {
        id: "test-1",
        x: 50,
        y: 25,
        isGoal: true,
        result: "Goal",
        bodyPart: "Foot",
        shotType: "Open Play",
        team: "home",
        timestamp: Date.now(),
      },
    ];

    // Pre-populate localStorage with shot data
    localStorageMock.setItem("shot-gobbler-data", JSON.stringify(mockShots));

    render(<App />);

    // Verify data was loaded (localStorage should still contain the data)
    const storedData = localStorageMock.getItem("shot-gobbler-data");
    expect(storedData).not.toBeNull();
    expect(JSON.parse(storedData!)).toEqual(mockShots);
  });

  it("should load actions from localStorage on initialization", () => {
    const mockActions = [
      {
        id: "action-1",
        x: 30,
        y: 40,
        actionType: "Pass",
        outcome: { type: "successful" as const },
        team: "home",
        timestamp: Date.now(),
      },
    ];

    localStorageMock.setItem(
      "shot-gobbler-touches-data",
      JSON.stringify(mockActions),
    );

    render(<App />);

    const storedData = localStorageMock.getItem("shot-gobbler-touches-data");
    expect(storedData).not.toBeNull();
    expect(JSON.parse(storedData!)).toEqual(mockActions);
  });

  it("should load pass chains from localStorage on initialization", () => {
    const mockPassChains = [
      {
        id: "chain-1",
        actions: [
          {
            x: 20,
            y: 30,
            actionType: "start" as const,
            sequenceNumber: 1,
          },
        ],
        terminationReason: "Shot",
        team: "home",
        timestamp: Date.now(),
      },
    ];

    localStorageMock.setItem(
      "shot-gobbler-pass-chains",
      JSON.stringify(mockPassChains),
    );

    render(<App />);

    const storedData = localStorageMock.getItem("shot-gobbler-pass-chains");
    expect(storedData).not.toBeNull();
    expect(JSON.parse(storedData!)).toEqual(mockPassChains);
  });

  it("should not overwrite localStorage with empty arrays on initialization", () => {
    const mockShots = [
      {
        id: "test-1",
        x: 50,
        y: 25,
        isGoal: true,
        result: "Goal",
        bodyPart: "Foot",
        shotType: "Open Play",
        team: "home",
        timestamp: Date.now(),
      },
    ];
    const mockActions = [
      {
        id: "action-1",
        x: 30,
        y: 40,
        actionType: "Pass",
        outcome: { type: "successful" as const },
        team: "home",
        timestamp: Date.now(),
      },
    ];
    const mockPassChains = [
      {
        id: "chain-1",
        actions: [
          {
            x: 20,
            y: 30,
            actionType: "start" as const,
            sequenceNumber: 1,
          },
        ],
        terminationReason: "Shot",
        team: "home",
        timestamp: Date.now(),
      },
    ];

    // Pre-populate localStorage with all data types
    localStorageMock.setItem("shot-gobbler-data", JSON.stringify(mockShots));
    localStorageMock.setItem(
      "shot-gobbler-touches-data",
      JSON.stringify(mockActions),
    );
    localStorageMock.setItem(
      "shot-gobbler-pass-chains",
      JSON.stringify(mockPassChains),
    );

    // Store original data for comparison
    const originalShots = localStorageMock.getItem("shot-gobbler-data");
    const originalActions = localStorageMock.getItem(
      "shot-gobbler-touches-data",
    );
    const originalChains = localStorageMock.getItem("shot-gobbler-pass-chains");

    // Render the app
    render(<App />);

    // Verify localStorage data was NOT overwritten with empty arrays
    expect(localStorageMock.getItem("shot-gobbler-data")).toBe(originalShots);
    expect(localStorageMock.getItem("shot-gobbler-touches-data")).toBe(
      originalActions,
    );
    expect(localStorageMock.getItem("shot-gobbler-pass-chains")).toBe(
      originalChains,
    );

    // Verify the data is still intact
    expect(JSON.parse(localStorageMock.getItem("shot-gobbler-data")!)).toEqual(
      mockShots,
    );
    expect(
      JSON.parse(localStorageMock.getItem("shot-gobbler-touches-data")!),
    ).toEqual(mockActions);
    expect(
      JSON.parse(localStorageMock.getItem("shot-gobbler-pass-chains")!),
    ).toEqual(mockPassChains);
  });

  it("should handle corrupted localStorage data gracefully", () => {
    // Set invalid JSON in localStorage
    localStorageMock.setItem("shot-gobbler-data", "invalid-json{");
    localStorageMock.setItem("shot-gobbler-touches-data", "not-valid-json");

    // Should not throw an error
    expect(() => render(<App />)).not.toThrow();

    // Should initialize with empty arrays when data is corrupted
    // The save effect will overwrite the corrupted data with valid empty arrays
    expect(localStorageMock.getItem("shot-gobbler-data")).toBe("[]");
    expect(localStorageMock.getItem("shot-gobbler-touches-data")).toBe("[]");
  });
});
