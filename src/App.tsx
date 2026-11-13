import { useCallback } from "react";
import MatchBar from "./components/MatchBar";
import NavBar from "./components/NavBar/NavBar";
import ShareButton from "./components/ShareButton";
import { ToastProvider } from "./components/Toast";
import { PASS_CHAINS_TAB, SHOTS_TAB, TOUCHES_TAB } from "./config/dataTabs";
import { useMatchData } from "./hooks/useMatchData";
import { useUrlState } from "./hooks/useUrlState";
import { DataTab, Tab, TABS } from "./types/Tab";
import { DataTabHandle, toDataTabHandle } from "./utils/dataTransfer";
import { getTeamNames, isMatchExport } from "./utils/matches";
import { notify } from "./utils/notify";
import DocsView from "./views/DocsView";
import PassChainsView from "./views/PassChainsView";
import ShotsView from "./views/ShotsView";
import TouchesView from "./views/TouchesView";

/** URL parameters that belong to one tab and are cleared when switching. */
const TAB_SPECIFIC_PARAMS = ["view", "filter", "pitch"] as const;

function AppContent() {
  const [activeTab, setActiveTabInternal] = useUrlState<Tab>(
    "tab",
    "docs",
    TABS,
  );

  // Matches and each tab's data for the current match, loaded from and
  // saved to localStorage
  const matchData = useMatchData();
  const {
    currentMatch,
    shots,
    setShots,
    actions,
    setActions,
    passChains,
    setPassChains,
    getEventStamp,
  } = matchData;
  const teamNames = getTeamNames(currentMatch);

  const dataTabs: Record<DataTab, DataTabHandle> = {
    shots: toDataTabHandle({ ...SHOTS_TAB, data: shots, setData: setShots }),
    touches: toDataTabHandle({
      ...TOUCHES_TAB,
      data: actions,
      setData: setActions,
    }),
    "pass-chains": toDataTabHandle({
      ...PASS_CHAINS_TAB,
      data: passChains,
      setData: setPassChains,
    }),
  };
  const activeDataTab = activeTab === "docs" ? null : dataTabs[activeTab];

  // Wrap setActiveTab to also clear view-specific parameters when switching tabs
  const setActiveTab = useCallback(
    (tab: Tab) => {
      // Clear view-specific parameters when switching tabs
      const searchParams = new URLSearchParams(window.location.search);
      for (const param of TAB_SPECIFIC_PARAMS) {
        searchParams.delete(param);
      }

      // Set the new tab
      if (tab === "docs") {
        searchParams.delete("tab");
      } else {
        searchParams.set("tab", tab);
      }

      // Update URL with pushState to create history entry
      const newUrl = searchParams.toString()
        ? `${window.location.pathname}?${searchParams.toString()}`
        : window.location.pathname;
      window.history.pushState({}, "", newUrl);

      setActiveTabInternal(tab);
    },
    [setActiveTabInternal],
  );

  // Read the chosen file and import it into the active tab
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeDataTab) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(e.target?.result as string);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        notify(
          "Failed to parse the imported file. Please ensure it's valid JSON.",
          "error",
        );
        return;
      }
      // A match file is accepted on any tab and becomes a new match
      if (isMatchExport(parsed)) {
        matchData.importMatch(parsed);
      } else {
        activeDataTab.importData(parsed);
      }
    };
    reader.onerror = () => {
      notify("Error reading the file.", "error");
    };
    reader.readAsText(file);
    // Allow importing the same file again
    event.target.value = "";
  };

  // Handle switching to pitch view before sharing
  const handleBeforeShare = useCallback(async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const currentView = searchParams.get("view");

    // If not already on pitch view, switch to it
    if (currentView !== "pitch") {
      searchParams.set("view", "pitch");
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState({}, "", newUrl);

      // Dispatch a custom event to notify the view components
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  return (
    <>
      {/* On phones the bottom padding keeps content clear of the fixed
          bottom tab bar (3.75rem plus the safe area) */}
      <div className="mx-auto flex h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="relative min-h-0 flex-1">
          <main
            id="main-content"
            className="flex h-full w-full flex-col overflow-y-auto bg-gray-100 p-5"
          >
            {activeDataTab && (
              // The data menu sits at the end of the match row, so it never
              // covers the view controls or the pitch
              <div className="flex shrink-0 items-start gap-2">
                <div className="min-w-0 flex-1">
                  <MatchBar
                    matches={matchData.matches}
                    currentMatch={currentMatch}
                    onSelect={matchData.selectMatch}
                    onCreate={matchData.addMatch}
                    onUpdate={matchData.updateMatch}
                    onDuplicate={matchData.duplicateMatch}
                    onDelete={matchData.deleteMatch}
                    onExport={matchData.exportMatch}
                    onClockChange={matchData.updateClock}
                  />
                </div>
                <ShareButton
                  title={activeDataTab.shareTitle}
                  className="h-10 w-10 rounded-md border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
                  hasData={activeDataTab.hasData}
                  onExportJSON={activeDataTab.exportData}
                  onExportMatch={matchData.exportMatch}
                  onImport={handleImport}
                  onBeforeShare={handleBeforeShare}
                />
              </div>
            )}
            {activeTab === "docs" && <DocsView />}
            {activeTab === "shots" && (
              <ShotsView
                shots={shots}
                setShots={setShots}
                teamNames={teamNames}
                getEventStamp={getEventStamp}
              />
            )}
            {activeTab === "touches" && (
              <TouchesView
                actions={actions}
                setActions={setActions}
                getEventStamp={getEventStamp}
              />
            )}
            {activeTab === "pass-chains" && (
              <PassChainsView
                passChains={passChains}
                setPassChains={setPassChains}
                getEventStamp={getEventStamp}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
