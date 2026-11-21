import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { Shot } from "./types/Shot";

// Shots view stand-in: shows what it receives and can add or clear shots
vi.mock("./views/ShotsView", () => ({
  default: ({
    shots,
    setShots,
    teamNames,
    getEventStamp,
  }: {
    shots: Shot[];
    setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
    teamNames: { home: string; away: string };
    getEventStamp: () => { matchId: string };
  }) => (
    <div>
      <div data-testid="shot-ids">{shots.map((s) => s.id).join(",")}</div>
      <div data-testid="team-names">
        {teamNames.home}/{teamNames.away}
      </div>
      <button
        onClick={() =>
          setShots((prev) => [
            ...prev,
            {
              ...getEventStamp(),
              id: `new-${prev.length}`,
              x: 1,
              y: 1,
              isGoal: false,
              result: "Miss",
              bodyPart: "Foot",
              shotType: "Open Play",
              team: "home",
              timestamp: 1,
            },
          ])
        }
      >
        Add shot
      </button>
      <button onClick={() => setShots([])}>Clear shots</button>
    </div>
  ),
}));

vi.mock("./views/DocsView", () => ({
  default: () => <div data-testid="docs-view" />,
}));

vi.mock("./components/ShareButton", () => ({
  default: ({
    onImport,
    onExportJSON,
  }: {
    onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExportJSON?: () => void;
  }) => (
    <div>
      <input data-testid="import-input" type="file" onChange={onImport} />
      <button onClick={onExportJSON}>Export tab</button>
    </div>
  ),
}));

const shot = (id: string, matchId?: string) => ({
  id,
  x: 50,
  y: 25,
  isGoal: false,
  result: "Miss",
  bodyPart: "Foot",
  shotType: "Open Play",
  team: "home",
  timestamp: 1700000000000,
  ...(matchId ? { matchId } : {}),
});

const envelope = (type: string, version: number, data: unknown[]) =>
  JSON.stringify({ app: "shot-gobbler", type, version, data });

const stored = (key: string) => JSON.parse(localStorage.getItem(key)!).data;
const storedShots = () => stored("shot-gobbler-data");
const storedMatches = () => stored("shot-gobbler-matches");
const shotIds = () => screen.getByTestId("shot-ids").textContent;

const openSheet = () =>
  fireEvent.click(screen.getByRole("button", { name: /change match/i }));
const sheet = () => screen.getByRole("dialog");

/** Captures the next download started through a link click. */
const captureDownload = () => {
  const download = { href: "", name: "" };
  const spy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      download.href = this.href;
      download.name = this.download;
    });
  return {
    json: () =>
      JSON.parse(
        decodeURIComponent(download.href.slice(download.href.indexOf(",") + 1)),
      ),
    download,
    restore: () => spy.mockRestore(),
  };
};

const importFile = (data: unknown) => {
  const file = new File([JSON.stringify(data)], "import.json");
  fireEvent.change(screen.getByTestId("import-input"), {
    target: { files: [file] },
  });
};

const twoMatches = [
  {
    id: "m1",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    date: "2026-11-01",
    createdAt: 1,
  },
  {
    id: "m2",
    homeTeam: "Leeds",
    awayTeam: "Hull",
    date: "2026-11-08",
    competition: "Cup",
    createdAt: 2,
  },
];

describe("App - matches", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("puts old data into an Untitled match", () => {
    localStorage.setItem(
      "shot-gobbler-data",
      JSON.stringify([shot("a"), shot("b")]),
    );
    render(<App />);

    expect(shotIds()).toBe("a,b");
    expect(
      screen.getByRole("button", { name: /change match/i }).textContent,
    ).toContain("Untitled match");
    expect(screen.getByTestId("team-names").textContent).toBe("Home/Away");
    expect(storedMatches()).toEqual([
      expect.objectContaining({ id: "default-match", homeTeam: "" }),
    ]);
    expect(storedShots().map((s: Shot) => s.matchId)).toEqual([
      "default-match",
      "default-match",
    ]);
  });

  it("creates the default match when stored matches don't include it", () => {
    localStorage.setItem(
      "shot-gobbler-matches",
      envelope("matches", 1, twoMatches),
    );
    localStorage.setItem("shot-gobbler-data", JSON.stringify([shot("old")]));
    render(<App />);

    expect(storedMatches().map((m: { id: string }) => m.id)).toEqual([
      "m1",
      "m2",
      "default-match",
    ]);
  });

  it("is hidden on the docs tab", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(screen.queryByRole("button", { name: /change match/i })).toBeNull();
  });

  describe("with two matches", () => {
    beforeEach(() => {
      localStorage.setItem(
        "shot-gobbler-matches",
        envelope("matches", 1, twoMatches),
      );
      localStorage.setItem("shot-gobbler-current-match", JSON.stringify("m1"));
      localStorage.setItem(
        "shot-gobbler-data",
        envelope("shots", 2, [shot("a", "m1"), shot("b", "m2")]),
      );
    });

    it("shows only the current match's items and its team names", () => {
      render(<App />);
      expect(shotIds()).toBe("a");
      expect(screen.getByTestId("team-names").textContent).toBe(
        "Arsenal/Chelsea",
      );
    });

    it("switches matches", () => {
      render(<App />);
      openSheet();
      fireEvent.click(within(sheet()).getByText("Leeds vs Hull"));

      expect(shotIds()).toBe("b");
      expect(screen.getByTestId("team-names").textContent).toBe("Leeds/Hull");
      expect(localStorage.getItem("shot-gobbler-current-match")).toBe('"m2"');
    });

    it("adds new items to the current match", () => {
      render(<App />);
      fireEvent.click(screen.getByText("Add shot"));
      expect(shotIds()).toBe("a,new-1");
      expect(storedShots().find((s: Shot) => s.id === "new-1").matchId).toBe(
        "m1",
      );
    });

    it("clears only the current match's items", () => {
      render(<App />);
      fireEvent.click(screen.getByText("Clear shots"));
      expect(shotIds()).toBe("");
      expect(storedShots().map((s: Shot) => s.id)).toEqual(["b"]);
    });

    it("creates a match and switches to it", () => {
      render(<App />);
      openSheet();
      fireEvent.click(within(sheet()).getByText("+ New match"));
      fireEvent.change(within(sheet()).getByLabelText("Home team"), {
        target: { value: " Spurs " },
      });
      fireEvent.change(within(sheet()).getByLabelText("Away team"), {
        target: { value: "Fulham" },
      });
      fireEvent.change(within(sheet()).getByLabelText("Date"), {
        target: { value: "2026-12-24" },
      });
      fireEvent.click(within(sheet()).getByText("Create"));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(
        screen.getByRole("button", { name: /change match/i }).textContent,
      ).toContain("Spurs vs Fulham2026-12-24");
      expect(shotIds()).toBe("");
      expect(storedMatches()).toHaveLength(3);
      expect(storedMatches()[2]).toMatchObject({
        homeTeam: "Spurs",
        awayTeam: "Fulham",
        date: "2026-12-24",
      });
    });

    it("edits a match", () => {
      render(<App />);
      openSheet();
      fireEvent.click(within(sheet()).getByLabelText("Edit Leeds vs Hull"));
      fireEvent.change(within(sheet()).getByLabelText("Home team"), {
        target: { value: "Leeds United" },
      });
      fireEvent.change(
        within(sheet()).getByLabelText("Competition (optional)"),
        { target: { value: "" } },
      );
      fireEvent.click(within(sheet()).getByText("Save"));

      expect(within(sheet()).getByText("Leeds United vs Hull")).toBeTruthy();
      expect(storedMatches()[1]).not.toHaveProperty("competition");
    });

    it("duplicates match details without the data", () => {
      render(<App />);
      openSheet();
      fireEvent.click(
        within(sheet()).getByLabelText("Duplicate Arsenal vs Chelsea"),
      );

      expect(storedMatches()).toHaveLength(3);
      expect(storedMatches()[2]).toMatchObject({
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        date: "2026-11-01",
      });
      expect(storedMatches()[2].id).not.toBe("m1");
      expect(shotIds()).toBe("");
    });

    it("deletes a match with its data, and Undo brings both back", async () => {
      render(<App />);
      openSheet();
      fireEvent.click(
        within(sheet()).getByLabelText("Delete Arsenal vs Chelsea"),
      );

      expect(storedMatches().map((m: { id: string }) => m.id)).toEqual(["m2"]);
      expect(storedShots().map((s: Shot) => s.id)).toEqual(["b"]);
      expect(shotIds()).toBe("b");
      // The last match cannot be deleted
      expect(
        within(sheet())
          .getByLabelText("Delete Leeds vs Hull")
          .hasAttribute("disabled"),
      ).toBe(true);

      fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
      expect(storedMatches().map((m: { id: string }) => m.id)).toEqual([
        "m1",
        "m2",
      ]);
      expect(
        storedShots()
          .map((s: Shot) => s.id)
          .sort(),
      ).toEqual(["a", "b"]);
    });

    it("exports the current match's items from a tab", () => {
      const capture = captureDownload();
      render(<App />);
      fireEvent.click(screen.getByText("Export tab"));
      expect(capture.json().data.map((s: Shot) => s.id)).toEqual(["a"]);
      capture.restore();
    });

    it("imports tab data into the current match", async () => {
      render(<App />);
      importFile([shot("x", "m2")]);
      await waitFor(() => expect(storedShots()).toHaveLength(3));
      expect(storedShots()[2].matchId).toBe("m1");
    });

    it("round-trips a match through Export match and import", async () => {
      const capture = captureDownload();
      render(<App />);
      openSheet();
      fireEvent.click(within(sheet()).getByText("Export this match"));
      const file = capture.json();
      capture.restore();

      expect(capture.download.name).toBe(
        "match_arsenal-vs-chelsea_2026-11-01.json",
      );
      expect(file).toMatchObject({
        app: "shot-gobbler",
        type: "match",
        match: { id: "m1", homeTeam: "Arsenal" },
        shots: { type: "shots", data: [expect.objectContaining({ id: "a" })] },
      });

      // Importing works on any tab and creates a new match
      await act(async () => importFile(file));
      await waitFor(() => expect(storedMatches()).toHaveLength(3));
      const imported = storedMatches()[2];
      expect(imported).toMatchObject({
        homeTeam: "Arsenal",
        date: "2026-11-01",
      });
      expect(imported.id).not.toBe("m1");
      expect(localStorage.getItem("shot-gobbler-current-match")).toBe(
        JSON.stringify(imported.id),
      );
      expect(
        storedShots().filter((s: Shot) => s.matchId === imported.id),
      ).toHaveLength(1);
      expect((await screen.findByRole("status")).textContent).toContain(
        "Imported Arsenal vs Chelsea: 1 shots",
      );
    });
  });

  describe("match clock", () => {
    const T0 = new Date("2026-11-13T15:00:00Z").getTime();
    const MIN = 60_000;

    beforeEach(() => {
      // Only Date is faked: the clock is computed from timestamps
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(T0);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const clockText = () => screen.getByTestId("match-clock").textContent;
    // Starting the clock enters focus mode; these tests continue in review
    const startClockAndExitFocus = () => {
      fireEvent.click(screen.getByRole("button", { name: "Start clock" }));
      fireEvent.click(screen.getByRole("button", { name: "Exit focus mode" }));
    };

    it("records no minute before the clock is used", () => {
      render(<App />);
      expect(clockText()).toBe("–' 1H");
      fireEvent.click(screen.getByText("Add shot"));
      expect(storedShots()[0]).not.toHaveProperty("minute");
    });

    it("stamps events with the minute and period and survives a reload", () => {
      const { unmount } = render(<App />);
      startClockAndExitFocus();
      expect(clockText()).toBe("1' 1H");

      vi.setSystemTime(T0 + 22 * MIN + 30_000);
      fireEvent.click(screen.getByText("Add shot"));
      expect(storedShots()[0]).toMatchObject({ minute: 23, period: "1H" });

      // Reload: the clock is still running and still right
      unmount();
      vi.setSystemTime(T0 + 30 * MIN);
      render(<App />);
      expect(clockText()).toBe("31' 1H");
      expect(screen.getByRole("button", { name: "Pause clock" })).toBeTruthy();
    });

    it("uses the last minute while paused, and next period / adjust", () => {
      render(<App />);
      startClockAndExitFocus();
      vi.setSystemTime(T0 + 10 * MIN);
      fireEvent.click(screen.getByRole("button", { name: "Pause clock" }));
      vi.setSystemTime(T0 + 40 * MIN);
      fireEvent.click(screen.getByText("Add shot"));
      expect(storedShots()[0]).toMatchObject({ minute: 11, period: "1H" });

      openSheet();
      fireEvent.click(
        within(sheet()).getByRole("button", { name: "One minute forward" }),
      );
      expect(clockText()).toBe("12' 1H");
      fireEvent.click(within(sheet()).getByText("Next: 2H"));
      expect(clockText()).toBe("46' 2H");
      fireEvent.click(
        within(sheet()).getByRole("button", { name: "One minute back" }),
      );
      expect(clockText()).toBe("46' 2H");
    });
  });
});

describe("App - futsal matches", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?tab=shots");
    localStorage.setItem(
      "shot-gobbler-matches",
      envelope("matches", 1, twoMatches),
    );
    localStorage.setItem("shot-gobbler-current-match", JSON.stringify("m1"));
  });

  it("creates a futsal match with futsal periods", () => {
    render(<App />);
    openSheet();
    fireEvent.click(within(sheet()).getByText("+ New match"));
    fireEvent.change(within(sheet()).getByLabelText("Home team"), {
      target: { value: "Ilves" },
    });
    fireEvent.click(within(sheet()).getByRole("radio", { name: "Futsal" }));
    fireEvent.click(within(sheet()).getByText("Create"));

    expect(storedMatches()[2]).toMatchObject({
      homeTeam: "Ilves",
      pitchType: "futsal",
    });
    openSheet();
    expect(within(sheet()).getByText(/· Futsal$/)).toBeTruthy();
    // The second half starts at 20 minutes
    fireEvent.click(within(sheet()).getByText("Next: 2H"));
    expect(screen.getByTestId("match-clock").textContent).toBe("21' 2H");
  });

  it("stores nothing for football and drops futsal when edited back", () => {
    localStorage.setItem(
      "shot-gobbler-matches",
      envelope("matches", 1, [
        { ...twoMatches[0], pitchType: "futsal" },
        twoMatches[1],
      ]),
    );
    render(<App />);
    openSheet();
    fireEvent.click(within(sheet()).getByLabelText("Edit Arsenal vs Chelsea"));
    fireEvent.click(within(sheet()).getByRole("radio", { name: "Football" }));
    fireEvent.click(within(sheet()).getByText("Save"));

    expect(storedMatches()[0]).not.toHaveProperty("pitchType");
  });
});
