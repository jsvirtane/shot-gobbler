import React, { useCallback, useEffect, useState } from "react";
import { Accordion } from "../components/Accordion";
import { ClearButton } from "../components/common";
import ShotCard from "../components/ShotCard";
import ShotForm from "../components/ShotForm/ShotForm";
import ShotList from "../components/ShotList/ShotList";
import ShotMap from "../components/ShotMap/ShotMap";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useUrlState } from "../hooks/useUrlState";
import { Team } from "../types/common";
import { Shot } from "../types/Shot";

type DisplayFilter = "all" | "home" | "away";
type ShotsView = "pitch" | "list";

interface ShotsViewProps {
  shots: Shot[];
  setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
}

const ShotsView: React.FC<ShotsViewProps> = ({ shots, setShots }) => {
  const [currentTeam, setCurrentTeam] = useState<Team>("home");

  const [shotsView, setShotsView] = useUrlState<ShotsView>("view", "pitch");
  const [shotDisplayFilter, setShotDisplayFilter] = useUrlState<DisplayFilter>(
    "filter",
    "all",
  );

  const [currentShotIndex, setCurrentShotIndex] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShotCoords, setCurrentShotCoords] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

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

  const handleRemoveShot = useCallback(
    (id: string) => {
      setShots((prevShots) => prevShots.filter((shot) => shot.id !== id));
      console.log("Removed shot with id:", id);
    },
    [setShots],
  );

  const handleClearAllShots = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all shots? This cannot be undone.",
      )
    ) {
      setShots([]);
      console.log("Cleared all shots");
    }
  }, [setShots]);

  // Shot navigation handlers
  const handleNextShot = useCallback(() => {
    setCurrentShotIndex((prev) => (prev + 1) % filteredShots.length);
  }, [filteredShots.length]);

  const handlePreviousShot = useCallback(() => {
    setCurrentShotIndex((prev) =>
      prev === 0 ? filteredShots.length - 1 : prev - 1,
    );
  }, [filteredShots.length]);

  // Reset current shot index when filter changes
  useEffect(() => {
    setCurrentShotIndex(0);
  }, [shotDisplayFilter]);

  // Ensure currentShotIndex is within bounds
  const safeCurrentShotIndex = Math.min(
    currentShotIndex,
    Math.max(0, filteredShots.length - 1),
  );

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
        <div className="flex flex-col gap-4">
          {filteredShots.length > 0 && (
            <Accordion
              header={<h3 className="text-lg font-semibold">Shot details</h3>}
              defaultOpen={true}
            >
              <ShotCard
                shot={filteredShots[safeCurrentShotIndex]}
                currentIndex={safeCurrentShotIndex}
                totalShots={filteredShots.length}
                onNext={handleNextShot}
                onPrevious={handlePreviousShot}
              />
            </Accordion>
          )}
          <Accordion
            header={
              <h3 className="text-lg font-semibold">
                Recorded Shots ({filteredShots.length})
              </h3>
            }
          >
            <ShotList shots={filteredShots} onRemoveShot={handleRemoveShot} />
          </Accordion>
          {filteredShots.length > 0 && shotDisplayFilter === "all" && (
            <ClearButton onClick={handleClearAllShots}>
              Clear All Shots
            </ClearButton>
          )}
        </div>
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
