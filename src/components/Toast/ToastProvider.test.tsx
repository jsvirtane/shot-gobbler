import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notify } from "../../utils/notify";
import { ToastProvider } from "./ToastProvider";
import {
  ToastOptions,
  ToastPlacement,
  useHideToasts,
  useToast,
  useToastPlacement,
} from "./toastContext";

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

  it("takes taps only on its buttons, so the pitch below gets the rest", () => {
    renderWith({
      message: "Saved",
      action: { label: "Undo", onClick: () => {} },
    });
    fireEvent.click(screen.getByText("Show"));

    expect(screen.getByTestId("toast-viewport").className).toContain(
      "pointer-events-none",
    );
    expect(screen.getByRole("status").className).toContain(
      "pointer-events-none",
    );
    expect(screen.getByRole("button", { name: "Undo" }).className).toContain(
      "pointer-events-auto",
    );
    expect(screen.getByRole("button", { name: "Dismiss" }).className).toContain(
      "pointer-events-auto",
    );
  });

  it("shows a bold lead, a colour dot and a hidden label", () => {
    renderWith({
      message: "ARS · Head",
      lead: "Miss",
      dot: "#123456",
      srLabel: "Shot added",
    });
    fireEvent.click(screen.getByText("Show"));

    const toast = screen.getByRole("status");
    expect(toast.querySelector("strong")?.textContent).toBe("Miss");
    expect(toast.textContent).toContain("Shot added: Miss · ARS · Head");
    expect(
      (toast.querySelector("[aria-hidden=true]") as HTMLElement).style
        .backgroundColor,
    ).toBe("rgb(18, 52, 86)");
  });

  it("shows only the newest toast as a pill above the focus bar at the bottom", () => {
    const Placed: React.FC<{ placement: ToastPlacement }> = ({ placement }) => {
      useToastPlacement(placement);
      return null;
    };
    const { rerender } = render(
      <ToastProvider>
        <Placed placement="bottom" />
        <Trigger options={{ message: "One" }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Show"));
    fireEvent.click(screen.getByText("Show"));

    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.dataset.placement).toBe("bottom");
    expect(viewport.className).toContain("bottom-[");
    expect(screen.getAllByRole("status")).toHaveLength(1);

    rerender(
      <ToastProvider>
        <Placed placement="top" />
        <Trigger options={{ message: "One" }} />
      </ToastProvider>,
    );
    expect(viewport.dataset.placement).toBe("top");
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("hides toasts while a radial menu (or anything else) asks it to", () => {
    const Hider: React.FC = () => {
      useHideToasts();
      return null;
    };
    const { rerender } = render(
      <ToastProvider>
        <Hider />
        <Trigger options={{ message: "Saved" }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("Show"));
    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.className).toContain("invisible");

    rerender(
      <ToastProvider>
        <Trigger options={{ message: "Saved" }} />
      </ToastProvider>,
    );
    expect(viewport.className).not.toContain("invisible");
    expect(screen.getByRole("status").textContent).toContain("Saved");
  });
});
