import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import html2canvas from "html2canvas-pro";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShareButton from "./ShareButton";

// Mock html2canvas
vi.mock("html2canvas-pro", () => ({
  default: vi.fn(),
}));

describe("ShareButton Component", () => {
  const mockOnExportJSON = vi.fn();
  const mockOnImport = vi.fn();
  const mockOnBeforeShare = vi.fn();

  // Mock navigator.share and navigator.canShare
  const mockShare = vi.fn();
  const mockCanShare = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockOnExportJSON.mockReset();
    mockOnImport.mockReset();
    mockOnBeforeShare.mockReset();
    mockShare.mockReset();
    mockCanShare.mockReset();

    // Setup navigator mocks
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, "canShare", {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });

    // Default implementations
    mockShare.mockResolvedValue(undefined);
    mockCanShare.mockReturnValue(true);
  });

  describe("Import Mode (No Data)", () => {
    it("should render import button when hasData is false", () => {
      render(
        <ShareButton
          hasData={false}
          onImport={mockOnImport}
          onExportJSON={mockOnExportJSON}
        />,
      );

      // Should show import icon (upload arrow)
      const importButton = screen.getByRole("button", {
        name: /import data/i,
      });
      expect(importButton).toBeTruthy();

      // Should not show share icon
      expect(
        screen.queryByRole("button", { name: /share or export/i }),
      ).toBeNull();
    });

    it("should trigger file input when import button is clicked", () => {
      render(
        <ShareButton
          hasData={false}
          onImport={mockOnImport}
          onExportJSON={mockOnExportJSON}
        />,
      );

      const importButton = screen.getByRole("button", {
        name: /import data/i,
      });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      expect(fileInput).toBeTruthy();
      expect(fileInput.className).toContain("hidden");

      // Spy on fileInput click
      const clickSpy = vi.spyOn(fileInput, "click");

      fireEvent.click(importButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it("should call onImport when file is selected", () => {
      render(
        <ShareButton
          hasData={false}
          onImport={mockOnImport}
          onExportJSON={mockOnExportJSON}
        />,
      );

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      // Create a mock file
      const mockFile = new File(["{}"], "test.json", {
        type: "application/json",
      });

      // Simulate file selection
      Object.defineProperty(fileInput, "files", {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnImport).toHaveBeenCalled();
    });

    it("should accept only .json files", () => {
      render(
        <ShareButton
          hasData={false}
          onImport={mockOnImport}
          onExportJSON={mockOnExportJSON}
        />,
      );

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      expect(fileInput.accept).toBe(".json");
    });
  });

  describe("Share Mode (Has Data)", () => {
    it("should render share button when hasData is true", () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      expect(shareButton).toBeTruthy();
    });

    it("should open menu when share button is clicked", () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });

      // Menu should not be visible initially
      expect(screen.queryByText("Share Image")).toBeNull();
      expect(screen.queryByText("Export JSON")).toBeNull();

      // Click to open menu
      fireEvent.click(shareButton);

      // Menu should now be visible
      expect(screen.getByText("Share Image")).toBeTruthy();
      expect(screen.getByText("Export JSON")).toBeTruthy();
    });

    it("should close menu when clicking backdrop", async () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });

      // Open menu
      fireEvent.click(shareButton);
      expect(screen.getByText("Share Image")).toBeTruthy();

      // Click backdrop
      const backdrop = document.querySelector(".fixed.inset-0");
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop!);

      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByText("Share Image")).toBeNull();
      });
    });

    it("should toggle menu open and close on button click", () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });

      // First click - open
      fireEvent.click(shareButton);
      expect(screen.getByText("Share Image")).toBeTruthy();

      // Second click - close
      fireEvent.click(shareButton);
      expect(screen.queryByText("Share Image")).toBeNull();
    });
  });

  describe("Export JSON Functionality", () => {
    it("should call onExportJSON when Export JSON is clicked", () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      // Open menu
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);

      // Click Export JSON
      const exportButton = screen.getByText("Export JSON");
      fireEvent.click(exportButton);

      expect(mockOnExportJSON).toHaveBeenCalledTimes(1);
    });

    it("should close menu after exporting JSON", async () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      // Open menu
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);

      // Click Export JSON
      const exportButton = screen.getByText("Export JSON");
      fireEvent.click(exportButton);

      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByText("Export JSON")).toBeNull();
      });
    });
  });

  describe("Share Image Functionality", () => {
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      // Mock html2canvas to return a canvas
      mockCanvas = document.createElement("canvas");
      mockCanvas.toDataURL = vi.fn(() => "data:image/png;base64,mock");
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas);

      // Mock fetch for blob conversion
      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          blob: () =>
            Promise.resolve(new Blob(["mock"], { type: "image/png" })),
        } as Response),
      );

      // Mock URL.createObjectURL and revokeObjectURL
      globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      globalThis.URL.revokeObjectURL = vi.fn();
    });

    it("should call onBeforeShare before capturing screenshot", async () => {
      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          onBeforeShare={mockOnBeforeShare}
          targetElementId="share-pitch"
        />,
      );

      // Open menu
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);

      // Click Share Image
      const shareImageButton = screen.getByText("Share Image");
      fireEvent.click(shareImageButton);

      await waitFor(() => {
        expect(mockOnBeforeShare).toHaveBeenCalled();
      });

      document.body.removeChild(targetElement);
    });

    it("should capture target element with html2canvas", async () => {
      const targetElement = document.createElement("div");
      targetElement.id = "custom-target";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          targetElementId="custom-target"
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalledWith(
          targetElement,
          expect.objectContaining({
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#f3f4f6",
            scale: 2,
            scrollX: 0,
            scrollY: 0,
          }),
        );
      });

      document.body.removeChild(targetElement);
    });

    it("should use Web Share API when available and supported", async () => {
      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          title="Test Analysis"
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            files: expect.arrayContaining([
              expect.objectContaining({
                name: "test-analysis.png",
                type: "image/png",
              }),
            ]),
          }),
        );
      });

      document.body.removeChild(targetElement);
    });

    it("should download image when Web Share API is not available", async () => {
      // Disable Web Share API
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          title="Shot Analysis"
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      // Wait for html2canvas to be called
      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalledWith(
          targetElement,
          expect.any(Object),
        );
      });

      // Verify URL methods were called (download flow)
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();

      document.body.removeChild(targetElement);
    });

    it("should close menu after sharing image", async () => {
      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      // Open menu
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);

      // Click Share Image
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(screen.queryByText("Share Image")).toBeNull();
      });

      document.body.removeChild(targetElement);
    });

    it("should handle errors gracefully when screenshot fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(html2canvas).mockRejectedValue(new Error("Canvas error"));

      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error sharing screenshot:",
          expect.any(Error),
        );
      });

      document.body.removeChild(targetElement);
      consoleErrorSpy.mockRestore();
    });

    it("should handle missing target element gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          targetElementId="non-existent-element"
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Target element not found for screenshot",
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("should wait for onBeforeShare to complete before capturing", async () => {
      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      let beforeShareCompleted = false;
      const slowBeforeShare = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        beforeShareCompleted = true;
      });

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          onBeforeShare={slowBeforeShare}
          targetElementId="share-pitch"
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(beforeShareCompleted).toBe(true);
        expect(html2canvas).toHaveBeenCalled();
      });

      document.body.removeChild(targetElement);
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          className="custom-class rounded-full"
        />,
      );

      const button = container.querySelector("button");
      expect(button?.className).toContain("custom-class");
      expect(button?.className).toContain("rounded-full");
    });

    it("should use custom title for filename generation", async () => {
      // Disable Web Share API to test download
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch";
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          title="Custom Analysis Title"
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      // Wait for html2canvas to be called with custom title context
      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalledWith(
          targetElement,
          expect.any(Object),
        );
      });

      // Verify download flow was triggered
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();

      document.body.removeChild(targetElement);
    });

    it("should use default targetElementId when not provided", async () => {
      const targetElement = document.createElement("div");
      targetElement.id = "share-pitch"; // default ID
      document.body.appendChild(targetElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalledWith(
          targetElement,
          expect.any(Object),
        );
      });

      document.body.removeChild(targetElement);
    });

    it("should fallback to main element when targetElementId is not found", async () => {
      const mainElement = document.createElement("main");
      document.body.appendChild(mainElement);

      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
          targetElementId=""
        />,
      );

      // Open menu and click Share Image
      const shareButton = screen.getByRole("button", {
        name: /share or export/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share Image"));

      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalledWith(
          mainElement,
          expect.any(Object),
        );
      });

      document.body.removeChild(mainElement);
    });
  });

  describe("Menu Accessibility", () => {
    it("should have proper aria-labels", () => {
      render(
        <ShareButton
          hasData={true}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      const shareButton = screen.getByLabelText("Share or export");
      expect(shareButton).toBeTruthy();
    });

    it("should have proper aria-label for import button", () => {
      render(
        <ShareButton
          hasData={false}
          onExportJSON={mockOnExportJSON}
          onImport={mockOnImport}
        />,
      );

      const importButton = screen.getByLabelText("Import data");
      expect(importButton).toBeTruthy();
    });
  });
});
