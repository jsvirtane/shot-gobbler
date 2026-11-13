import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NavBar from "./NavBar";

const renderNavBar = (
  activeTab: "docs" | "shots" | "touches" | "pass-chains" = "shots",
) => {
  const setActiveTab = vi.fn();
  render(<NavBar activeTab={activeTab} setActiveTab={setActiveTab} />);
  return { setActiveTab };
};

describe("NavBar", () => {
  it("renders four tab buttons inside the main navigation", () => {
    renderNavBar();

    const nav = screen.getByRole("navigation", { name: "Main" });
    const tabs = within(nav).getAllByRole("button");

    expect(tabs).toHaveLength(4);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "📖Docs",
      "⚽Shots",
      "👟Touches",
      "🔗Chains",
    ]);
    tabs.forEach((tab) => expect(tab.getAttribute("type")).toBe("button"));
  });

  it("gives tabs accessible names without the emoji", () => {
    renderNavBar();

    for (const name of ["Docs", "Shots", "Touches", "Chains"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
  });

  it("marks only the active tab with aria-current", () => {
    renderNavBar("touches");

    expect(
      screen
        .getByRole("button", { name: "Touches" })
        .getAttribute("aria-current"),
    ).toBe("page");
    for (const name of ["Docs", "Shots", "Chains"]) {
      expect(
        screen.getByRole("button", { name }).hasAttribute("aria-current"),
      ).toBe(false);
    }
  });

  it("calls setActiveTab when a tab is clicked", () => {
    const { setActiveTab } = renderNavBar("docs");

    fireEvent.click(screen.getByRole("button", { name: "Chains" }));

    expect(setActiveTab).toHaveBeenCalledWith("pass-chains");
  });

  it("navigates to docs when the logo is clicked", () => {
    const { setActiveTab } = renderNavBar("shots");

    fireEvent.click(
      screen.getByRole("button", { name: "Shot Gobbler – home" }),
    );

    expect(setActiveTab).toHaveBeenCalledWith("docs");
  });

  it("makes the logo and tabs keyboard focusable", () => {
    renderNavBar();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    for (const button of buttons) {
      button.focus();
      expect(document.activeElement).toBe(button);
    }
  });
});
