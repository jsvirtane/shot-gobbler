import { useState } from "react";
import NavBar from "./components/NavBar/NavBar";
import PassChainsView from "./views/PassChainsView";
import ShotsView from "./views/ShotsView";
import TouchesView from "./views/TouchesView";

function App() {
  const [activeTab, setActiveTab] = useState<
    "shots" | "touches" | "pass-chains"
  >("shots");

  return (
    <div className="mx-auto flex h-screen flex-col">
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex w-full flex-grow flex-col bg-gray-100 p-5">
        {activeTab === "shots" && <ShotsView />}
        {activeTab === "touches" && <TouchesView />}
        {activeTab === "pass-chains" && <PassChainsView />}
      </main>
    </div>
  );
}

export default App;
