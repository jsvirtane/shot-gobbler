import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RadialMenu, { RadialSection } from ".";

const BOUNDS = { width: 390, height: 590 };

const sections: RadialSection[] = [
  {
    label: "Result",
    items: [
      { id: "goal", label: "Goal", icon: "star", color: "#16a34a" },
      {
        id: "saved",
        label: "Saved",
        icon: "disc",
        color: "#0891b2",
        current: true,
      },
      { id: "blocked", label: "Blocked", icon: "triangle", color: "#4b5563" },
      { id: "miss", label: "Miss", icon: "ring", color: "#dc2626" },
    ],
  },
  {
    label: "Details",
    items: [
      {
        id: "head",
        label: "Head",
        kind: "toggle",
        on: true,
        ariaLabel: "Header",
      },
      { id: "set", label: "Set piece", kind: "toggle", on: false },
      { id: "no", label: "Shirt #", kind: "nav", ariaLabel: "Shirt number" },
    ],
  },
  {
    label: "Edit",
    items: [
      { id: "move", label: "Move", icon: "move", kind: "nav" },
      { id: "del", label: "Delete", icon: "trash", kind: "danger" },
    ],
  },
];

const setup = (
  props: Partial<React.ComponentProps<typeof RadialMenu>> = {},
) => {
  const onPick = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <RadialMenu
      anchor={{ x: 195, y: 295 }}
      sections={sections}
      bounds={BOUNDS}
      onPick={onPick}
      onClose={onClose}
      {...props}
    />,
  );
  return { onPick, onClose, ...utils };
};

describe("RadialMenu", () => {
  it("draws one labelled segment button per option", () => {
    setup();
    for (const name of [
      "Goal",
      "Saved",
      "Blocked",
      "Miss",
      "Header",
      "Set piece",
      "Shirt number",
      "Move",
      "Delete",
    ]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(
      screen.getAllByTestId("radial-section-label").map((l) => l.textContent),
    ).toEqual(["RESULT", "DETAILS", "EDIT"]);
  });

  it("draws each option as an annular sector path", () => {
    setup();
    const d = screen
      .getByRole("button", { name: "Goal" })
      .querySelector("path")
      ?.getAttribute("d");
    expect(d).toMatch(/^M .* A \d+ \d+ 0 0 1 .* L .* A 44 44 0 0 0 .* Z$/);
  });

  it("marks toggles with aria-pressed and a check or plus icon", () => {
    setup();
    const head = screen.getByRole("button", { name: "Header" });
    const set = screen.getByRole("button", { name: "Set piece" });
    expect(head.getAttribute("aria-pressed")).toBe("true");
    expect(set.getAttribute("aria-pressed")).toBe("false");
    expect(head.querySelector("[data-icon=check]")).toBeTruthy();
    expect(set.querySelector("[data-icon=plus]")).toBeTruthy();
    expect(head.querySelector("path")?.getAttribute("class")).toContain(
      "fill-blue-600",
    );
    expect(
      screen.getByRole("button", { name: "Goal" }).hasAttribute("aria-pressed"),
    ).toBe(false);
  });

  it("styles actions, nav and danger options", () => {
    setup();
    expect(
      screen
        .getByRole("button", { name: "Goal" })
        .querySelector("path")
        ?.getAttribute("fill"),
    ).toBe("#16a34a");
    expect(
      screen
        .getByRole("button", { name: "Move" })
        .querySelector("path")
        ?.getAttribute("class"),
    ).toContain("fill-blue-50");
    expect(
      screen
        .getByRole("button", { name: "Delete" })
        .querySelector("path")
        ?.getAttribute("class"),
    ).toContain("fill-red-50");
  });

  it("outlines the current value", () => {
    setup();
    const saved = screen.getByRole("button", { name: "Saved" });
    expect(saved.getAttribute("aria-current")).toBe("true");
    expect(saved.querySelector("[data-testid=radial-current]")).toBeTruthy();
    expect(screen.getAllByTestId("radial-current")).toHaveLength(1);
  });

  it("passes action picks to onPick without closing", () => {
    const { onPick, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Goal" }));
    expect(onPick).toHaveBeenCalledWith(sections[0].items[0]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("passes toggle picks to onPick and stays open", () => {
    const { onPick, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Set piece" }));
    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "set", kind: "toggle" }),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("radial-menu")).toBeTruthy();
  });

  it("closes on a tap outside the ring", () => {
    const { onClose, onPick } = setup();
    fireEvent.click(screen.getByTestId("radial-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("does not close on a tap on the ring between options", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByTestId("radial-ring"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each(["Enter", " "])("activates a focused option with %j", (key) => {
    const { onPick } = setup();
    const miss = screen.getByRole("button", { name: "Miss" });
    expect(miss.getAttribute("tabindex")).toBe("0");
    miss.focus();
    fireEvent.keyDown(miss, { key });
    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "miss" }),
    );
  });

  it("ignores other keys on an option", () => {
    const { onPick } = setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Miss" }), {
      key: "a",
    });
    expect(onPick).not.toHaveBeenCalled();
  });

  it("moves focus into the menu and restores it on close", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    const { unmount } = setup();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    unmount();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("renders a clickable centre button", () => {
    const onClick = vi.fn();
    const { onClose } = setup({
      center: {
        content: <b>HOM</b>,
        ariaLabel: "Team Home. Tap to switch team",
        onClick,
        color: "#2563eb",
      },
    });
    const centre = screen.getByRole("button", {
      name: "Team Home. Tap to switch team",
    });
    expect(centre.textContent).toBe("HOM");
    expect(centre.style.boxShadow).toContain("4px");
    fireEvent.click(centre);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders a static centre without onClick", () => {
    setup({ center: { content: "Hi", ariaLabel: "Shirt number" } });
    expect(screen.getByTestId("radial-center").tagName).toBe("DIV");
  });

  it("centres the ring on the tap point when it fits", () => {
    setup({ center: { content: "", ariaLabel: "c" } });
    const centre = screen.getByTestId("radial-center");
    expect(centre.style.left).toBe("195px");
    expect(centre.style.top).toBe("295px");
    expect(screen.queryByTestId("radial-leader")).toBeNull();
  });

  it("moves the ring on screen and draws a leader line from the tap point", () => {
    setup({
      anchor: { x: 5, y: 580 },
      center: { content: "", ariaLabel: "c" },
    });
    const centre = screen.getByTestId("radial-center");
    expect(parseFloat(centre.style.left)).toBeGreaterThan(5);
    expect(parseFloat(centre.style.top)).toBeLessThan(580);
    const leader = screen.getByTestId("radial-leader");
    expect(leader.getAttribute("x1")).toBe("5");
    expect(leader.getAttribute("y1")).toBe("580");
    expect(screen.getByTestId("radial-tap-mark")).toBeTruthy();
  });

  it("keeps clear of insets", () => {
    setup({
      anchor: { x: 195, y: 500 },
      insets: { bottom: 80 },
      center: { content: "", ariaLabel: "c" },
    });
    const top = parseFloat(screen.getByTestId("radial-center").style.top);
    expect(top).toBeLessThanOrEqual(590 - 80 - 118 - 5 - 26);
  });

  it("is left out of the share image", () => {
    setup();
    expect(
      screen.getByTestId("radial-menu").getAttribute("data-html2canvas-ignore"),
    ).toBe("true");
  });

  it("skips the label of a section without one", () => {
    setup({ sections: [{ items: sections[0].items }] });
    expect(screen.queryByTestId("radial-section-label")).toBeNull();
  });
});
