import { useCallback } from "react";
import NavBar from "./components/NavBar/NavBar";
import ShareButton from "./components/ShareButton";
import { useUrlState } from "./hooks/useUrlState";
import DocsView from "./views/DocsView";
import PassChainsView from "./views/PassChainsView";
import ShotsView from "./views/ShotsView";
import TouchesView from "./views/TouchesView";

function App() {
  const [activeTab, setActiveTabInternal] = useUrlState<
    "docs" | "shots" | "touches" | "pass-chains"
  >("tab", "docs");

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
            />
          </div>
        )}
        <main
          id="main-content"
          className="flex h-full w-full flex-col bg-gray-100 p-5"
        >
          {activeTab === "docs" && <DocsView />}
          {activeTab === "shots" && <ShotsView />}
          {activeTab === "touches" && <TouchesView />}
          {activeTab === "pass-chains" && <PassChainsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
