import React, { useCallback, useEffect, useState } from "react";
import ShotForm from "../components/ShotForm/ShotForm";
import ShotList from "../components/ShotList/ShotList";
import ShotMap from "../components/ShotMap/ShotMap";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { Shot } from "../types/Shot";
import { Team } from "../types/common";

// Storage key for localStorage
const SHOTS_STORAGE_KEY = "shot-gobbler-data";

type DisplayFilter = "all" | "home" | "away";
type ShotsView = "pitch" | "list";

const ShotsView: React.FC = () => {
  const [shots, setShots] = useState<Shot[]>(() => {
    try {
      const savedShots = localStorage.getItem(SHOTS_STORAGE_KEY);
      return savedShots ? JSON.parse(savedShots) : [];
    } catch (error) {
      console.error("Error loading shots from localStorage:", error);
      return [];
    }
  });

  const [currentTeam, setCurrentTeam] = useState<Team>("home");

  const [shotsView, setShotsView] = useState<ShotsView>("pitch");
  const [shotDisplayFilter, setShotDisplayFilter] =
    useState<DisplayFilter>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShotCoords, setCurrentShotCoords] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  useEffect(() => {
    try {
      localStorage.setItem(SHOTS_STORAGE_KEY, JSON.stringify(shots));
    } catch (error) {
      console.error("Error saving shots to localStorage:", error);
    }
  }, [shots]);

  // Shot filtering
  const filteredShots = shots.filter((shot) => {
    if (shotDisplayFilter === "all") return true;
    return shot.team === shotDisplayFilter;
  });

  // Modal/interaction handlers
  const handlePitchClick = (x: number, y: number) => {
    console.log(`Pitch clicked at: x=${x}, y=${y}`);
    setCurrentShotCoords({ x, y });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Shot "CRUD" operations
  const handleAddShot = (details: Omit<Shot, "id" | "timestamp">) => {
    const newShot: Shot = {
      ...details,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
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

  // UI components
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

  const viewOptions = [
    { id: "pitch", label: "Pitch View", icon: "⚽" },
    { id: "list", label: "List View", icon: "📋" },
  ];

  return (
    <>
      <ViewToggle
        currentView={shotsView}
        options={viewOptions}
        onViewChange={(view) => setShotsView(view as ShotsView)}
        className="mb-4"
      />
      {filterButtonsUI}

      {shotsView === "pitch" ? (
        <>
          <p className="text-center text-base text-black md:text-lg lg:text-xl">
            HOME
          </p>
          <ShotMap onPitchClick={handlePitchClick} shots={filteredShots} />
          <p className="text-center text-base text-black md:text-lg lg:text-xl">
            AWAY
          </p>
        </>
      ) : (
        <ShotList
          shots={filteredShots}
          onRemoveShot={handleRemoveShot}
          onClearAllShots={handleClearAllShots}
          onImportShots={handleImportShots}
          displayFilter={shotDisplayFilter}
        />
      )}
      <ShotForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddShot}
        initialCoords={currentShotCoords}
        defaultTeam={currentTeam}
      />
    </>
  );
};

export default ShotsView;
