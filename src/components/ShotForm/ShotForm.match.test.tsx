import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ShotForm from "./ShotForm";

describe("ShotForm - match details", () => {
  const renderForm = (
    props: Partial<React.ComponentProps<typeof ShotForm>>,
  ) => {
    const onSubmit = vi.fn();
    render(
      <ShotForm
        isOpen
        onClose={() => {}}
        onSubmit={onSubmit}
        initialCoords={{ x: 50, y: 20 }}
        {...props}
      />,
    );
    return onSubmit;
  };

  it("labels the team buttons with the match's team names", () => {
    renderForm({ teamNames: { home: "Leeds", away: "Hull" } });
    expect(screen.getByText("🏠 Leeds")).toBeTruthy();
    expect(screen.getByText("🚌 Hull")).toBeTruthy();
  });

  it("pre-fills the clock minute and lets the user override it", () => {
    const onSubmit = renderForm({ defaultMinute: 23 });
    const input = screen.getByLabelText("Minute:") as HTMLInputElement;
    expect(input.value).toBe("23");

    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.click(screen.getByText("Add Shot"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ minute: 30 }),
    );
  });

  it("leaves the minute to the clock when the input is empty", () => {
    const onSubmit = renderForm({});
    fireEvent.click(screen.getByText("Add Shot"));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("minute");
  });
});
