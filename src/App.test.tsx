import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  default: ({
    onImport,
    onExportJSON,
  }: {
    onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExportJSON?: () => void;
  }) => (
    <div data-testid="share-button">
      Share
      <input data-testid="import-input" type="file" onChange={onImport} />
      <button data-testid="export-json" onClick={onExportJSON}>
        Export
      </button>
    </div>
  ),
}));

/** Parses a stored envelope and returns it (throws if the key is empty). */
const readEnvelope = (key: string) => {
  const raw = window.localStorage.getItem(key);
  expect(raw).not.toBeNull();
  return JSON.parse(raw!);
};

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

  describe("Invalid URL Parameters", () => {
    it("should show the docs view when the tab parameter is invalid", () => {
      window.history.replaceState({}, "", "/?tab=foo");

      render(<App />);

      expect(screen.getByTestId("active-tab").textContent).toBe("docs");
      expect(screen.getByTestId("docs-view")).toBeTruthy();
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

    it("should clear the pitch parameter when switching tabs", () => {
      window.history.replaceState({}, "", "/?tab=shots&view=pitch&pitch=half");

      render(<App />);

      fireEvent.click(screen.getByTestId("nav-touches"));

      expect(window.location.search).toBe("?tab=touches");
      expect(window.location.search).not.toContain("pitch=half");
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

  it("should initialize with empty envelopes when localStorage is empty", () => {
    render(<App />);

    // After initialization, empty data is saved to localStorage in a
    // versioned envelope
    for (const [key, type] of [
      ["shot-gobbler-data", "shots"],
      ["shot-gobbler-touches-data", "touches"],
      ["shot-gobbler-pass-chains", "pass-chains"],
    ]) {
      const envelope = readEnvelope(key);
      expect(envelope).toMatchObject({ app: "shot-gobbler", type, data: [] });
      expect(typeof envelope.version).toBe("number");
    }
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
    // Old bare-array data is loaded and re-saved in an envelope, unchanged
    expect(readEnvelope("shot-gobbler-data").data).toEqual(mockShots);
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

    // Old bare-array data is loaded and re-saved in an envelope, unchanged
    expect(readEnvelope("shot-gobbler-touches-data").data).toEqual(mockActions);
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

    // Old bare-array data is loaded and re-saved in an envelope, unchanged
    expect(readEnvelope("shot-gobbler-pass-chains").data).toEqual(
      mockPassChains,
    );
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

    // Render the app
    render(<App />);

    // Verify localStorage data was NOT overwritten with empty arrays: the
    // same items are still there, now wrapped in an envelope
    expect(readEnvelope("shot-gobbler-data").data).toEqual(mockShots);
    expect(readEnvelope("shot-gobbler-touches-data").data).toEqual(mockActions);
    expect(readEnvelope("shot-gobbler-pass-chains").data).toEqual(
      mockPassChains,
    );
  });

  it("should load data already stored in an envelope", () => {
    const envelope = {
      app: "shot-gobbler",
      type: "shots",
      version: 1,
      data: [{ id: "test-1", x: 50, y: 25 }],
    };
    localStorageMock.setItem("shot-gobbler-data", JSON.stringify(envelope));

    render(<App />);

    expect(readEnvelope("shot-gobbler-data").data).toEqual(envelope.data);
  });

  it("should handle corrupted localStorage data gracefully", () => {
    // Set invalid JSON in localStorage
    localStorageMock.setItem("shot-gobbler-data", "invalid-json{");
    localStorageMock.setItem("shot-gobbler-touches-data", "not-valid-json");

    // Should not throw an error
    expect(() => render(<App />)).not.toThrow();

    // Should initialize with empty data when data is corrupted
    // The save effect will overwrite the corrupted data with valid empty data
    expect(readEnvelope("shot-gobbler-data").data).toEqual([]);
    expect(readEnvelope("shot-gobbler-touches-data").data).toEqual([]);
  });
});

describe("App - Import", () => {
  const existingShot = {
    id: "existing-1",
    x: 50,
    y: 25,
    isGoal: true,
    result: "Goal",
    bodyPart: "Foot",
    shotType: "Open Play",
    team: "home",
    timestamp: 1700000000000,
  };

  const importFile = (data: unknown) => {
    const file = new File([JSON.stringify(data)], "import.json", {
      type: "application/json",
    });
    fireEvent.change(screen.getByTestId("import-input"), {
      target: { files: [file] },
    });
  };

  const storedShots = () => {
    const raw = window.localStorage.getItem("shot-gobbler-data");
    return raw ? JSON.parse(raw).data : [];
  };

  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("adds imported shots to existing shots instead of replacing them", async () => {
    window.localStorage.setItem(
      "shot-gobbler-data",
      JSON.stringify([existingShot]),
    );
    render(<App />);

    importFile([
      { ...existingShot, id: "imported-1", result: "Saved", isGoal: false },
      { ...existingShot, id: "imported-2", result: "Miss", isGoal: false },
    ]);

    await waitFor(() => expect(storedShots()).toHaveLength(3));
    const shots = storedShots();
    expect(shots[0].id).toBe("existing-1");
    expect(shots.map((s: { result: string }) => s.result)).toEqual([
      "Goal",
      "Saved",
      "Miss",
    ]);
    // Imported items get fresh, unique ids
    expect(new Set(shots.map((s: { id: string }) => s.id)).size).toBe(3);
  });

  it("refuses a file of the wrong type and keeps existing data", async () => {
    window.localStorage.setItem(
      "shot-gobbler-data",
      JSON.stringify([existingShot]),
    );
    render(<App />);

    importFile([
      {
        id: "a1",
        x: 30,
        y: 40,
        category: "attacking",
        actionType: "pass",
        outcome: "successful",
        timestamp: 1,
      },
    ]);

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("Touches tab"),
      ),
    );
    expect(storedShots()).toEqual([existingShot]);
  });
});

describe("App - Export", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("exports data in an envelope with type and version", () => {
    const shot = {
      id: "s1",
      x: 50,
      y: 25,
      isGoal: true,
      result: "Goal",
      bodyPart: "Foot",
      shotType: "Open Play",
      team: "home",
      timestamp: 1700000000000,
    };
    window.localStorage.setItem("shot-gobbler-data", JSON.stringify([shot]));
    window.history.replaceState({}, "", "/?tab=shots");
    let href = "";
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        href = this.href;
      });

    render(<App />);
    fireEvent.click(screen.getByTestId("export-json"));

    expect(click).toHaveBeenCalled();
    const json = decodeURIComponent(href.slice(href.indexOf(",") + 1));
    const exported = JSON.parse(json);
    expect(exported).toMatchObject({ app: "shot-gobbler", type: "shots" });
    expect(typeof exported.version).toBe("number");
    expect(exported.data).toEqual([shot]);
    click.mockRestore();
  });
});
