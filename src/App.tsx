import { useState } from "react";
import NavBar from "./components/NavBar/NavBar";
import ShareButton from "./components/ShareButton";
import PassChainsView from "./views/PassChainsView";
import ShotsView from "./views/ShotsView";
import TouchesView from "./views/TouchesView";

function App() {
  const [activeTab, setActiveTab] = useState<
    "shots" | "touches" | "pass-chains"
  >("shots");

  // Get a descriptive title based on the active tab
  const getShareTitle = () => {
    switch (activeTab) {
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
        {/* Floating Share Button */}
        <div className="fixed top-20 right-4 z-20">
          <ShareButton
            title={getShareTitle()}
            className="rounded-full bg-white shadow-lg hover:shadow-xl"
          />
        </div>
        <main
          id="main-content"
          className="flex h-full w-full flex-col bg-gray-100 p-5"
        >
          {activeTab === "shots" && <ShotsView />}
          {activeTab === "touches" && <TouchesView />}
          {activeTab === "pass-chains" && <PassChainsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
