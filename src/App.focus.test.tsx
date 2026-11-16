import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { FOCUS_MODE_STORAGE_KEY } from "./hooks/useFocusMode";
import { mockRect } from "./test/pointerEvents";

vi.mock("./assets/football_pitch.svg", () => ({ default: "pitch.svg" }));
vi.mock("./views/DocsView", () => ({
  default: () => <div data-testid="docs-view" />,
}));
vi.mock("./components/ShareButton", () => ({
  default: () => <div data-testid="share-button" />,
}));

const bar = () => screen.queryByTestId("focus-bar");
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const enterFocus = () => fireEvent.click(button(/^Track/));
const params = () => new URLSearchParams(window.location.search);

describe("App - focus mode", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("enters from the Track button and leaves from the bar", () => {
    render(<App />);
    expect(bar()).toBeNull();
    expect(screen.getByTestId("match-clock")).toBeTruthy();

    enterFocus();
    expect(bar()).toBeTruthy();
    // Only the pitch and the bar: no match bar, tab bar, toggles or legend
    expect(screen.queryByTestId("match-clock")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "View" })).toBeNull();
    expect(screen.queryByTestId("share-button")).toBeNull();
    expect(screen.getByTestId("pitch")).toBeTruthy();
    expect(params().get("focus")).toBe("1");
    expect(localStorage.getItem(FOCUS_MODE_STORAGE_KEY)).toBe("1");

    fireEvent.click(button("Exit focus mode"));
    expect(bar()).toBeNull();
    expect(screen.getByTestId("match-clock")).toBeTruthy();
    expect(params().has("focus")).toBe(false);
    expect(localStorage.getItem(FOCUS_MODE_STORAGE_KEY)).toBe("0");
  });

  it("remembers the last mode across visits", () => {
    localStorage.setItem(FOCUS_MODE_STORAGE_KEY, "1");
    render(<App />);
    expect(bar()).toBeTruthy();
    expect(params().get("focus")).toBe("1");
  });

  it("opens in focus mode from a ?focus=1 link", () => {
    window.history.replaceState({}, "", "/?tab=touches&focus=1");
    render(<App />);
    expect(bar()).toBeTruthy();
  });

  it("has no focus mode on the docs page", () => {
    window.history.replaceState({}, "", "/?focus=1");
    render(<App />);
    expect(bar()).toBeNull();
    expect(screen.getByTestId("docs-view")).toBeTruthy();
  });

  it("enters automatically when the clock is started, and the bar's clock pauses it", () => {
    render(<App />);
    fireEvent.click(button("Start clock"));
    expect(bar()).toBeTruthy();

    const clock = screen.getByTestId("focus-clock");
    expect(clock.getAttribute("aria-label")).toMatch(/Pause clock$/);
    fireEvent.click(clock);
    expect(clock.getAttribute("aria-label")).toMatch(/Start clock$/);
    // Starting it again from the bar keeps focus mode
    fireEvent.click(clock);
    expect(clock.getAttribute("aria-label")).toMatch(/Pause clock$/);
    expect(bar()).toBeTruthy();
  });

  it("cycles shots, touches and chains with the tracker switch and stays in focus", () => {
    render(<App />);
    enterFocus();

    fireEvent.click(button(/Switch to Touches/));
    expect(params().get("tab")).toBe("touches");
    expect(params().get("focus")).toBe("1");
    expect(bar()).toBeTruthy();

    fireEvent.click(button(/Switch to Chains/));
    expect(params().get("tab")).toBe("pass-chains");
    fireEvent.click(button(/Switch to Shots/));
    expect(params().get("tab")).toBe("shots");
    expect(bar()).toBeTruthy();
  });

  it("toggles the half pitch on shots only", () => {
    render(<App />);
    enterFocus();
    const half = button("Half pitch");
    expect(half.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(half);
    expect(button("Half pitch").getAttribute("aria-pressed")).toBe("true");
    expect(params().get("pitch")).toBe("half");
    expect(
      document.getElementById("share-pitch")?.getAttribute("data-variant"),
    ).toBe("half");

    fireEvent.click(button(/Switch to Touches/));
    expect(screen.queryByRole("button", { name: "Half pitch" })).toBeNull();
  });

  it("shows a team toggle in the bar on the half pitch, used for new shots", () => {
    mockRect(100, 100);
    render(<App />);
    enterFocus();
    expect(screen.queryByTestId("focus-team")).toBeNull();
    fireEvent.click(button("Half pitch"));

    const team = screen.getByTestId("focus-team");
    expect(team.getAttribute("aria-label")).toBe(
      "Team for new shots: Home. Switch team",
    );
    expect(screen.getByTestId("pitch-label-bottom").textContent).toBe(
      "Goal ↓ · Home",
    );
    fireEvent.click(team);
    expect(team.textContent).toContain("Away");
    expect(screen.getByTestId("pitch-label-bottom").textContent).toBe(
      "Goal ↓ · Away",
    );

    // A tap near the goal at the bottom records an Away shot there
    fireEvent.click(document.getElementById("share-pitch")!, {
      clientX: 40,
      clientY: 80,
    });
    expect(
      screen.getByRole("button", { name: "Team Away. Tap to switch team" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Goal" }));
    const marker = screen.getByTestId("shot-marker");
    expect(marker.style.left).toBe("40%");
    expect(marker.style.top).toBe("90%");

    fireEvent.click(button("Half pitch"));
    expect(screen.queryByTestId("focus-team")).toBeNull();
  });

  it("labels the goal ends with the team names on the full pitch", () => {
    render(<App />);
    enterFocus();
    expect(screen.getByTestId("pitch-label-top").textContent).toBe("Home ↑");
    expect(screen.getByTestId("pitch-label-bottom").textContent).toBe("Away ↓");
  });

  it("undoes the in-progress pass chain's last point", () => {
    mockRect(300, 450);
    window.history.replaceState({}, "", "/?tab=pass-chains&focus=1");
    render(<App />);
    const undo = button("Undo");
    expect((undo as HTMLButtonElement).disabled).toBe(true);

    const pitch = document.getElementById("share-pitch")!;
    fireEvent.click(pitch, { clientX: 100, clientY: 100 });
    expect((undo as HTMLButtonElement).disabled).toBe(false);
    // The next point's step is picked from a ring over the pitch
    fireEvent.click(pitch, { clientX: 150, clientY: 200 });
    fireEvent.click(button("Pass"));
    expect(screen.queryByTestId("radial-menu")).toBeNull();

    fireEvent.click(undo);
    fireEvent.click(undo);
    expect((undo as HTMLButtonElement).disabled).toBe(true);
  });

  it("fades the bar after 3.5 s without input and brings it back on a touch", () => {
    vi.useFakeTimers();
    render(<App />);
    enterFocus();
    expect(bar()!.className).toContain("opacity-100");

    act(() => {
      vi.advanceTimersByTime(3400);
    });
    expect(bar()!.className).toContain("opacity-100");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(bar()!.className).toContain("opacity-50");

    fireEvent.pointerDown(document.body);
    expect(bar()!.className).toContain("opacity-100");
  });
});
