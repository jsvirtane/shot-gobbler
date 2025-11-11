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
