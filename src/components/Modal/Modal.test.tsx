import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders an accessible dialog labelled by its title", () => {
    render(
      <Modal isOpen title="Test Title">
        <button>Inside</button>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Test Title" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("renders nothing when closed", () => {
    render(
      <Modal isOpen={false} title="Hidden">
        <p>content</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Esc" onClose={onClose}>
        <p>content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a backdrop click but not on a click inside the dialog", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Backdrop" onClose={onClose}>
        <p>content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText("content"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the dialog when opened", () => {
    render(
      <Modal isOpen title="Focus">
        <p>content</p>
      </Modal>,
    );
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("keeps Tab focus inside the dialog", () => {
    render(
      <Modal isOpen title="Trap">
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const last = screen.getByText("Last");
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByText("First"));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("limits its height so long forms scroll on small screens", () => {
    render(
      <Modal isOpen title="Scroll">
        <p>content</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("max-h-");
    expect(dialog.className).toContain("overflow-y-auto");
  });
});
