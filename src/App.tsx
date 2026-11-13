import { useCallback, useEffect, useState } from "react";
import NavBar from "./components/NavBar/NavBar";
import ShareButton from "./components/ShareButton";
import { useUrlState } from "./hooks/useUrlState";
import {
  createEnvelope,
  parseStored,
  serializeForStorage,
} from "./utils/dataSchema";
import { validateImport } from "./utils/importValidation";
import { Action } from "./types/Action";
import { PassChain } from "./types/PassChain";
import { Shot } from "./types/Shot";
import DocsView from "./views/DocsView";
import PassChainsView from "./views/PassChainsView";
import ShotsView from "./views/ShotsView";
import TouchesView from "./views/TouchesView";

// Storage keys
const SHOTS_STORAGE_KEY = "shot-gobbler-data";
const TOUCHES_STORAGE_KEY = "shot-gobbler-touches-data";
const PASS_CHAINS_STORAGE_KEY = "shot-gobbler-pass-chains";

const TABS = ["docs", "shots", "touches", "pass-chains"] as const;

function App() {
  const [activeTab, setActiveTabInternal] = useUrlState<(typeof TABS)[number]>(
    "tab",
    "docs",
    TABS,
  );

  // Track data for each view - initialize from localStorage
  const [shots, setShots] = useState<Shot[]>(() => {
    try {
      const stored = parseStored(
        localStorage.getItem(SHOTS_STORAGE_KEY),
        "shots",
      );
      return (stored as Shot[] | null) ?? [];
    } catch (error) {
      console.error("Error loading shots from localStorage:", error);
      return [];
    }
  });

  const [actions, setActions] = useState<Action[]>(() => {
    try {
      const stored = parseStored(
        localStorage.getItem(TOUCHES_STORAGE_KEY),
        "touches",
      );
      return (stored as Action[] | null) ?? [];
    } catch (error) {
      console.error("Error loading actions from localStorage:", error);
      return [];
    }
  });

  const [passChains, setPassChains] = useState<PassChain[]>(() => {
    try {
      const stored = parseStored(
        localStorage.getItem(PASS_CHAINS_STORAGE_KEY),
        "pass-chains",
      );
      return (stored as PassChain[] | null) ?? [];
    } catch (error) {
      console.error("Error loading pass chains from localStorage:", error);
      return [];
    }
  });

  // Save shots to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        SHOTS_STORAGE_KEY,
        serializeForStorage("shots", shots),
      );
    } catch (error) {
      console.error("Error saving shots to localStorage:", error);
    }
  }, [shots]);

  // Save actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        TOUCHES_STORAGE_KEY,
        serializeForStorage("touches", actions),
      );
    } catch (error) {
      console.error("Error saving actions to localStorage:", error);
    }
  }, [actions]);

  // Save pass chains to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        PASS_CHAINS_STORAGE_KEY,
        serializeForStorage("pass-chains", passChains),
      );
    } catch (error) {
      console.error("Error saving pass chains to localStorage:", error);
    }
  }, [passChains]);

  // Wrap setActiveTab to also clear view-specific parameters when switching tabs
  const setActiveTab = useCallback(
    (tab: "docs" | "shots" | "touches" | "pass-chains") => {
      // Clear view-specific parameters when switching tabs
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete("view");
      searchParams.delete("filter");

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

  // Get a descriptive title based on the active tab
  const getShareTitle = () => {
    switch (activeTab) {
      case "docs":
        return "Shot Gobbler - Football Analysis Tool";
      case "shots":
        return "Shot Analysis";
      case "touches":
        return "Touch Analysis";
      case "pass-chains":
        return "Pass Chain Analysis";
      default:
        return "Football Analysis";
    }
  };

  // Check if current tab has data
  const hasData = () => {
    switch (activeTab) {
      case "shots":
        return shots.length > 0;
      case "touches":
        return actions.length > 0;
      case "pass-chains":
        return passChains.length > 0;
      default:
        return false;
    }
  };

  // Handle export JSON based on active tab
  const handleExportJSON = useCallback(() => {
    let dataToExport: Shot[] | Action[] | PassChain[] = [];
    let filename = "";

    switch (activeTab) {
      case "shots":
        dataToExport = shots;
        filename = `shots_${new Date().toISOString().slice(0, 10)}.json`;
        break;
      case "touches":
        dataToExport = actions;
        filename = `touches_${new Date().toISOString().slice(0, 10)}.json`;
        break;
      case "pass-chains":
        dataToExport = passChains;
        filename = `pass-chains-${new Date().toISOString().split("T")[0]}.json`;
        break;
      default:
        return;
    }

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(createEnvelope<unknown>(activeTab, dataToExport), null, 2),
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = filename;
    link.click();
    console.log("Exporting data...");
  }, [activeTab, shots, actions, passChains]);

  // Handle import JSON based on active tab
  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData: unknown = JSON.parse(e.target?.result as string);

          // Imported items are always added to the existing data (never
          // replace it), and every item gets a fresh id.
          const reportImport = (imported: number, skipped: number) => {
            if (skipped === 0) return;
            const label =
              activeTab === "pass-chains" ? "pass chains" : activeTab;
            alert(
              `Imported ${imported} ${label}. Skipped ${skipped} invalid ${skipped === 1 ? "item" : "items"}.`,
            );
          };

          switch (activeTab) {
            case "shots": {
              const result = validateImport(importedData, "shots");
              if (!result.ok) return alert(result.error);
              setShots((prev) => [...prev, ...result.items]);
              reportImport(result.items.length, result.skipped);
              break;
            }
            case "touches": {
              const result = validateImport(importedData, "touches");
              if (!result.ok) return alert(result.error);
              setActions((prev) => [...prev, ...result.items]);
              reportImport(result.items.length, result.skipped);
              break;
            }
            case "pass-chains": {
              const result = validateImport(importedData, "pass-chains");
              if (!result.ok) return alert(result.error);
              setPassChains((prev) => [...prev, ...result.items]);
              reportImport(result.items.length, result.skipped);
              break;
            }
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert(
            "Failed to parse the imported file. Please ensure it's valid JSON.",
          );
        }
      };
      reader.onerror = () => {
        alert("Error reading the file.");
      };
      reader.readAsText(file);
      // Allow importing the same file again
      event.target.value = "";
    },
    [activeTab],
  );

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
    <div className="mx-auto flex h-screen flex-col">
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="relative flex-grow">
        {/* Floating Share Button - Hide on docs page */}
        {activeTab !== "docs" && (
          <div className="fixed top-20 right-4 z-20">
            <ShareButton
              title={getShareTitle()}
              className="rounded-full bg-white shadow-lg hover:shadow-xl"
              hasData={hasData()}
              onExportJSON={handleExportJSON}
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
  );
}

export default App;
