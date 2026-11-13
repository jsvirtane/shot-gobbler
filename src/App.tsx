import { useCallback } from "react";
import NavBar from "./components/NavBar/NavBar";
import ShareButton from "./components/ShareButton";
import { ToastProvider } from "./components/Toast";
import { PASS_CHAINS_TAB, SHOTS_TAB, TOUCHES_TAB } from "./config/dataTabs";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useUrlState } from "./hooks/useUrlState";
import { Action } from "./types/Action";
import { PassChain } from "./types/PassChain";
import { Shot } from "./types/Shot";
import { DataTab, Tab, TABS } from "./types/Tab";
import { DataTabHandle, toDataTabHandle } from "./utils/dataTransfer";
import { notify } from "./utils/notify";
import DocsView from "./views/DocsView";
import PassChainsView from "./views/PassChainsView";
import ShotsView from "./views/ShotsView";
import TouchesView from "./views/TouchesView";

const NO_SHOTS: Shot[] = [];
const NO_ACTIONS: Action[] = [];
const NO_PASS_CHAINS: PassChain[] = [];

/** URL parameters that belong to one tab and are cleared when switching. */
const TAB_SPECIFIC_PARAMS = ["view", "filter", "pitch"] as const;

function App() {
  const [activeTab, setActiveTabInternal] = useUrlState<Tab>(
    "tab",
    "docs",
    TABS,
  );

  // Data for each tab, loaded from and saved to localStorage
  const [shots, setShots] = useLocalStorageState(
    SHOTS_TAB.storageKey,
    NO_SHOTS,
    SHOTS_TAB.codec,
  );
  const [actions, setActions] = useLocalStorageState(
    TOUCHES_TAB.storageKey,
    NO_ACTIONS,
    TOUCHES_TAB.codec,
  );
  const [passChains, setPassChains] = useLocalStorageState(
    PASS_CHAINS_TAB.storageKey,
    NO_PASS_CHAINS,
    PASS_CHAINS_TAB.codec,
  );

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
      activeDataTab.importData(parsed);
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
    <ToastProvider>
      <div className="mx-auto flex h-screen flex-col">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="relative flex-grow">
          {/* Floating Share Button - Hide on docs page */}
          {activeDataTab && (
            <div className="fixed top-20 right-4 z-20">
              <ShareButton
                title={activeDataTab.shareTitle}
                className="rounded-full bg-white shadow-lg hover:shadow-xl"
                hasData={activeDataTab.hasData}
                onExportJSON={activeDataTab.exportData}
                onImport={handleImport}
                onBeforeShare={handleBeforeShare}
              />
            </div>
          )}
          <main
            id="main-content"
            className="flex h-full w-full flex-col bg-gray-100 p-5"
          >
            {activeTab === "docs" && <DocsView />}
            {activeTab === "shots" && (
              <ShotsView shots={shots} setShots={setShots} />
            )}
            {activeTab === "touches" && (
              <TouchesView actions={actions} setActions={setActions} />
            )}
            {activeTab === "pass-chains" && (
              <PassChainsView
                passChains={passChains}
                setPassChains={setPassChains}
              />
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
