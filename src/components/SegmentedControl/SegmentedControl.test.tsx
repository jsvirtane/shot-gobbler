import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import SegmentedControl, { SegmentedOption } from "./SegmentedControl";

type Fruit = "apple" | "banana" | "cherry";

const OPTIONS: SegmentedOption<Fruit>[] = [
  { value: "apple", label: "Apple", icon: "🍎" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", activeClassName: "bg-red-600" },
];

const Harness: React.FC<{ onChange?: (v: Fruit) => void }> = ({ onChange }) => {
  const [value, setValue] = useState<Fruit>("apple");
  return (
    <SegmentedControl
      ariaLabel="Fruit"
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
};

const radio = (name: string | RegExp) => screen.getByRole("radio", { name });

describe("SegmentedControl", () => {
  it("renders a labelled radio group with one radio per option", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "Fruit" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    // The icon is part of the visible text
    expect(radio("🍎 Apple")).toBeTruthy();
  });

  it("marks only the selected option as checked and tabbable", () => {
    render(<Harness />);
    expect(radio(/Apple/).getAttribute("aria-checked")).toBe("true");
    expect(radio("Banana").getAttribute("aria-checked")).toBe("false");
    expect(radio(/Apple/).tabIndex).toBe(0);
    expect(radio("Banana").tabIndex).toBe(-1);
  });

  it("selects an option on click", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(radio("Banana"));
    expect(onChange).toHaveBeenCalledWith("banana");
    expect(radio("Banana").getAttribute("aria-checked")).toBe("true");
    expect(radio(/Apple/).getAttribute("aria-checked")).toBe("false");
  });

  it("does not call onChange when the selected option is clicked again", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(radio(/Apple/));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses the default and per-option active colours", () => {
    render(<Harness />);
    expect(radio(/Apple/).className).toContain("bg-blue-600");
    expect(radio("Banana").className).toContain("bg-gray-200");
    fireEvent.click(radio("Cherry"));
    expect(radio("Cherry").className).toContain("bg-red-600");
  });

  it("moves selection and focus with arrow keys, wrapping around", () => {
    render(<Harness />);
    const apple = radio(/Apple/);
    apple.focus();

    fireEvent.keyDown(apple, { key: "ArrowRight" });
    expect(radio("Banana").getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radio("Banana"));

    fireEvent.keyDown(radio("Banana"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(radio("Cherry"));

    fireEvent.keyDown(radio("Cherry"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(radio(/Apple/));
    expect(radio(/Apple/).getAttribute("aria-checked")).toBe("true");

    fireEvent.keyDown(radio(/Apple/), { key: "ArrowLeft" });
    expect(radio("Cherry").getAttribute("aria-checked")).toBe("true");

    fireEvent.keyDown(radio("Cherry"), { key: "ArrowUp" });
    expect(radio("Banana").getAttribute("aria-checked")).toBe("true");
  });

  it("jumps to the first and last option with Home and End", () => {
    render(<Harness />);
    fireEvent.keyDown(radio(/Apple/), { key: "End" });
    expect(radio("Cherry").getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(radio("Cherry"), { key: "Home" });
    expect(radio(/Apple/).getAttribute("aria-checked")).toBe("true");
  });

  it("ignores other keys", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(radio(/Apple/), { key: "a" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the first option tabbable when the value matches none", () => {
    render(
      <SegmentedControl
        ariaLabel="Fruit"
        options={OPTIONS}
        value={"kiwi" as Fruit}
        onChange={() => {}}
      />,
    );
    expect(radio(/Apple/).tabIndex).toBe(0);
    expect(
      screen
        .getAllByRole("radio")
        .every((r) => r.getAttribute("aria-checked") === "false"),
    ).toBe(true);
  });

  it("lays options out in a grid when columns is set", () => {
    render(
      <SegmentedControl
        ariaLabel="Fruit"
        options={OPTIONS}
        value="apple"
        onChange={() => {}}
        columns={3}
      />,
    );
    expect(screen.getByRole("radiogroup").className).toContain("grid-cols-3");
  });
});
