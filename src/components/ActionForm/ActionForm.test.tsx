import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActionForm from "./ActionForm";

const renderForm = () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <ActionForm
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      initialCoords={{ x: 30, y: 40 }}
    />,
  );
  return { onSubmit, onClose };
};

const group = (name: string) => screen.getByRole("radiogroup", { name });
const checked = (name: string) =>
  within(group(name))
    .getAllByRole("radio")
    .find((r) => r.getAttribute("aria-checked") === "true")?.textContent;

describe("ActionForm", () => {
  it("starts with attacking / pass / successful", () => {
    renderForm();
    expect(checked("Action category")).toBe("Attacking");
    expect(checked("Action type")).toBe("Pass");
    expect(checked("Outcome")).toBe("✅ Successful");
    expect(within(group("Outcome")).getAllByRole("radio")).toHaveLength(4);
  });

  it("switching category selects its first action and default outcome", () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: "Defensive" }));
    expect(checked("Action type")).toBe("Tackle");
    expect(checked("Outcome")).toBe("✅ Won");

    fireEvent.click(screen.getByRole("radio", { name: "Duel" }));
    expect(checked("Action type")).toBe("Aerial Duel");
    expect(checked("Outcome")).toBe("✅ Successful");
  });

  it("shows the outcomes of the selected action type", () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: "Shot" }));
    expect(checked("Outcome")).toBe("⚽ Goal");
    expect(
      within(group("Outcome"))
        .getAllByRole("radio")
        .map((r) => r.textContent),
    ).toEqual(["⚽ Goal", "🎯 On Target", "↪️ Off Target", "🛑 Blocked"]);
  });

  it("colours unsuccessful outcomes red when selected", () => {
    renderForm();
    const unsuccessful = screen.getByRole("radio", { name: "❌ Unsuccessful" });
    fireEvent.click(unsuccessful);
    expect(unsuccessful.className).toContain("bg-red-600");
  });

  it("submits the selected values", () => {
    const { onSubmit, onClose } = renderForm();
    fireEvent.click(screen.getByRole("radio", { name: "Defensive" }));
    fireEvent.click(screen.getByRole("radio", { name: "Clearance" }));
    fireEvent.click(screen.getByText("Record Action"));
    expect(onSubmit).toHaveBeenCalledWith({
      x: 30,
      y: 40,
      category: "defensive",
      actionType: "clearance",
      outcome: "cleared",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
