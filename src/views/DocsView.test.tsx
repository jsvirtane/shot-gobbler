import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocsView from "./DocsView";

describe("DocsView", () => {
  it("explains focus mode, the rings and review mode, not forms", () => {
    const { container } = render(<DocsView />);
    for (const heading of [
      "📱 Focus Mode",
      "🎯 Recording with the Rings",
      "📋 Review Mode",
      "🎯 Marker Legend",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }
    expect(container.textContent).not.toMatch(/\bform\b/i);
  });

  it("shows the ring colours from the same source as the ring", () => {
    render(<DocsView />);
    // Saved is cyan in the ring, the list and here
    expect(screen.getAllByText("Saved")[0].style.backgroundColor).toBe(
      "rgb(8, 145, 178)",
    );
  });
});
