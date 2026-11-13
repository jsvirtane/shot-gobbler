import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notify } from "../../utils/notify";
import { ToastProvider } from "./ToastProvider";
import { ToastOptions, useToast } from "./toastContext";

const Trigger: React.FC<{ options: ToastOptions }> = ({ options }) => {
  const { showToast } = useToast();
  return <button onClick={() => showToast(options)}>Show</button>;
};

const renderWith = (options: ToastOptions) =>
  render(
    <ToastProvider>
      <Trigger options={options} />
    </ToastProvider>,
  );

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows a toast as a polite status message", () => {
    renderWith({ message: "Hello" });
    fireEvent.click(screen.getByText("Show"));

    const toast = screen.getByRole("status");
    expect(toast.textContent).toContain("Hello");
    expect(toast.getAttribute("aria-live")).toBe("polite");
  });

  it("uses role=alert for errors", () => {
    renderWith({ message: "Broken", variant: "error" });
    fireEvent.click(screen.getByText("Show"));

    expect(screen.getByRole("alert").textContent).toContain("Broken");
  });

  it("auto-dismisses after 4 seconds", () => {
    renderWith({ message: "Hello" });
    fireEvent.click(screen.getByText("Show"));

    act(() => vi.advanceTimersByTime(3900));
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("stays longer when it has an action", () => {
    renderWith({ message: "Hi", action: { label: "Undo", onClick: vi.fn() } });
    fireEvent.click(screen.getByText("Show"));

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1100));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("runs the action and dismisses the toast", () => {
    const onUndo = vi.fn();
    renderWith({ message: "Hi", action: { label: "Undo", onClick: onUndo } });
    fireEvent.click(screen.getByText("Show"));

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("can be dismissed by hand", () => {
    renderWith({ message: "Hi" });
    fireEvent.click(screen.getByText("Show"));

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps at most three toasts", () => {
    renderWith({ message: "Hi" });
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByText("Show"));

    expect(screen.getAllByRole("status")).toHaveLength(3);
  });

  it("shows notify() messages while mounted and falls back to alert", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { unmount } = renderWith({ message: "unused" });

    act(() => notify("Imported", "info"));
    expect(screen.getByRole("status").textContent).toContain("Imported");
    expect(alertSpy).not.toHaveBeenCalled();

    unmount();
    notify("No provider");
    expect(alertSpy).toHaveBeenCalledWith("No provider");
  });
});
