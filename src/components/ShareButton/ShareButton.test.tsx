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

  describe("Without data", () => {
    const openMenu = () =>
      fireEvent.click(
        screen.getByRole("button", { name: /share, export or import/i }),
      );

    it("keeps the same menu button instead of switching to an import icon", () => {
      render(
        <ShareButton
          hasData={false}
          onImport={mockOnImport}
          onExportJSON={mockOnExportJSON}
        />,
      );

      expect(
        screen.getByRole("button", { name: /share, export or import/i }),
      ).toBeTruthy();
      expect(screen.queryByRole("button", { name: /import data/i })).toBeNull();
    });

    it("disables the options that need data and keeps Import enabled", () => {
      render(
        <ShareButton
          hasData={false}
          onImport={mockOnImport}
          onExportJSON={mockOnExportJSON}
          onExportMatch={vi.fn()}
        />,
      );
      openMenu();

      const item = (name: string) =>
        screen.getByRole("menuitem", { name }) as HTMLButtonElement;
      expect(item("Share image").disabled).toBe(true);
      expect(item("Export JSON").disabled).toBe(true);
      expect(item("Export match").disabled).toBe(false);
      expect(item("Import").disabled).toBe(false);

      fireEvent.click(item("Export JSON"));
      expect(mockOnExportJSON).not.toHaveBeenCalled();
    });

    it("should trigger file input when Import is clicked", () => {
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

      expect(fileInput).toBeTruthy();
      expect(fileInput.className).toContain("hidden");

      // Spy on fileInput click
      const clickSpy = vi.spyOn(fileInput, "click");

      openMenu();
      fireEvent.click(screen.getByRole("menuitem", { name: "Import" }));

      expect(clickSpy).toHaveBeenCalled();
      // The menu closes; the file input stays for the picker's result
      expect(screen.queryByRole("menu")).toBeNull();
      expect(document.querySelector('input[type="file"]')).toBe(fileInput);
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
        name: /share, export or import/i,
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
        name: /share, export or import/i,
      });

      // Menu should not be visible initially
      expect(screen.queryByText("Share image")).toBeNull();
      expect(screen.queryByText("Export JSON")).toBeNull();

      // Click to open menu
      fireEvent.click(shareButton);

      // Menu should now be visible
      expect(screen.getByText("Share image")).toBeTruthy();
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
        name: /share, export or import/i,
      });

      // Open menu
      fireEvent.click(shareButton);
      expect(screen.getByText("Share image")).toBeTruthy();

      // Click backdrop
      const backdrop = document.querySelector(".fixed.inset-0");
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop!);

      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByText("Share image")).toBeNull();
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
        name: /share, export or import/i,
      });

      // First click - open
      fireEvent.click(shareButton);
      expect(screen.getByText("Share image")).toBeTruthy();

      // Second click - close
      fireEvent.click(shareButton);
      expect(screen.queryByText("Share image")).toBeNull();
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
        name: /share, export or import/i,
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
        name: /share, export or import/i,
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

  describe("Export match", () => {
    it("calls onExportMatch and closes the menu", () => {
      const onExportMatch = vi.fn();
      render(<ShareButton hasData={true} onExportMatch={onExportMatch} />);

      fireEvent.click(
        screen.getByRole("button", { name: /share, export or import/i }),
      );
      fireEvent.click(screen.getByRole("menuitem", { name: "Export match" }));

      expect(onExportMatch).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("is left out when no onExportMatch is given", () => {
      render(<ShareButton hasData={true} />);

      fireEvent.click(
        screen.getByRole("button", { name: /share, export or import/i }),
      );
      expect(
        screen.queryByRole("menuitem", { name: "Export match" }),
      ).toBeNull();
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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);

      // Click Share Image
      const shareImageButton = screen.getByText("Share image");
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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);

      // Click Share Image
      fireEvent.click(screen.getByText("Share image"));

      await waitFor(() => {
        expect(screen.queryByText("Share image")).toBeNull();
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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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
        name: /share, export or import/i,
      });
      fireEvent.click(shareButton);
      fireEvent.click(screen.getByText("Share image"));

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

      const shareButton = screen.getByLabelText("Share, export or import");
      expect(shareButton.getAttribute("aria-haspopup")).toBe("menu");
      expect(shareButton.getAttribute("aria-expanded")).toBe("false");
      fireEvent.click(shareButton);
      expect(shareButton.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByRole("menu")).toBeTruthy();
    });

    it("closes the menu on Escape", () => {
      render(<ShareButton hasData={true} onExportJSON={mockOnExportJSON} />);

      fireEvent.click(screen.getByLabelText("Share, export or import"));
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("menu")).toBeNull();
    });
  });
});
