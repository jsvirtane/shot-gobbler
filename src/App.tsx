import { useCallback, useEffect, useState } from "react";
import FootballPitch from "./components/FootballPitch/FootballPitch";
import ShotForm from "./components/ShotForm/ShotForm";
import ShotList from "./components/ShotList/ShotList";
import { Shot, Team } from "./types/Shot";

// Storage key for localStorage
const SHOTS_STORAGE_KEY = "shot-gobbler-data";

type DisplayFilter = "all" | "home" | "away";

function App() {
  // Initialize state from localStorage
  const [shots, setShots] = useState<Shot[]>(() => {
    try {
      const savedShots = localStorage.getItem(SHOTS_STORAGE_KEY);
      return savedShots ? JSON.parse(savedShots) : [];
    } catch (error) {
      console.error("Error loading shots from localStorage:", error);
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShotCoords, setCurrentShotCoords] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"pitch" | "shots">("pitch");
  const [currentTeam, setCurrentTeam] = useState<Team>("home");
  const [shotDisplayFilter, setShotDisplayFilter] =
    useState<DisplayFilter>("all");

  // Save shots to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SHOTS_STORAGE_KEY, JSON.stringify(shots));
    } catch (error) {
      console.error("Error saving shots to localStorage:", error);
    }
  }, [shots]);

  const handlePitchClick = useCallback((x: number, y: number) => {
    console.log(`Pitch clicked at: x=${x}, y=${y}`);
    setCurrentShotCoords({ x, y });
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAddShot = (details: Omit<Shot, "id" | "timestamp">) => {
    const newShot: Shot = {
      ...details,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, // Simple ID generation
      timestamp: Date.now(),
    };
    setShots((prevShots) => [...prevShots, newShot]);
    console.log("Added shot:", newShot);
  };

  const handleRemoveShot = useCallback((id: string) => {
    setShots((prevShots) => prevShots.filter((shot) => shot.id !== id));
    console.log("Removed shot with id:", id);
  }, []);

  const handleClearAllShots = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all shots? This cannot be undone.",
      )
    ) {
      setShots([]);
      console.log("Cleared all shots");
    }
  }, []);

  const handleImportShots = useCallback((importedShots: Shot[]) => {
    const shotsWithNewIds = importedShots.map((shot) => ({
      ...shot,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: shot.timestamp || Date.now(),
    }));
    setShots(shotsWithNewIds);
  }, []);

  const filteredShots = shots.filter((shot) => {
    if (shotDisplayFilter === "all") return true;
    return shot.team === shotDisplayFilter;
  });

  const filterButtonsUI = (
    <div className="mb-4 flex justify-center">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          onClick={() => {
            setCurrentTeam("home");
            setShotDisplayFilter("all");
          }}
          className={`rounded-l-lg px-4 py-2 text-sm font-medium ${
            shotDisplayFilter === "all"
              ? "bg-neutral-900 text-white"
              : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-100"
          }`}
        >
          All Shots
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentTeam("home");
            setShotDisplayFilter("home");
          }}
          className={`px-4 py-2 text-sm font-medium ${
            shotDisplayFilter === "home"
              ? "bg-neutral-900 text-white"
              : "border-y border-r border-gray-200 bg-white text-gray-900 hover:bg-gray-100"
          }`}
        >
          Home Team
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentTeam("away");
            setShotDisplayFilter("away");
          }}
          className={`rounded-r-lg px-4 py-2 text-sm font-medium ${
            shotDisplayFilter === "away"
              ? "bg-neutral-900 text-white"
              : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-100"
          }`}
        >
          Away Team
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex h-screen flex-col">
      <nav className="sticky top-0 right-0 left-0 z-10 flex h-15 w-full bg-gray-100 shadow-md">
        <div className="flex flex-1 cursor-pointer flex-col justify-center">
          <img
            src="/shot_gobbler.svg"
            alt="Shot Gobbler"
            className="h-20 w-25"
          />
        </div>
        <div className="flex flex-1 cursor-pointer flex-row items-center justify-center text-gray-500">
          <div
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center ${
              activeTab === "pitch"
                ? "font-bold text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("pitch")}
          >
            <span className="mb-1 text-2xl">⚽</span>
            <span className="text-xs">Pitch</span>
          </div>
          <div
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center ${
              activeTab === "shots"
                ? "font-bold text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("shots")}
          >
            <span className="mb-1 text-2xl">📋</span>
            <span className="text-xs">Shots</span>
          </div>
        </div>
      </nav>
      <main className="flex w-full flex-grow flex-col bg-gray-100 p-5">
        {filterButtonsUI}

        {activeTab === "pitch" && (
          <>
            <p className="text-center text-base text-black md:text-lg lg:text-xl">
              HOME
            </p>
            <FootballPitch
              onPitchClick={handlePitchClick}
              shots={filteredShots}
            />
            <p className="text-center text-base text-black md:text-lg lg:text-xl">
              AWAY
            </p>
            <ShotForm
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSubmit={handleAddShot}
              initialCoords={currentShotCoords}
              defaultTeam={currentTeam}
            />
          </>
        )}
        {activeTab === "shots" && (
          <ShotList
            shots={filteredShots}
            onRemoveShot={handleRemoveShot}
            onClearAllShots={handleClearAllShots}
            onImportShots={handleImportShots}
            displayFilter={shotDisplayFilter}
          />
        )}
      </main>
    </div>
  );
}

export default App;
