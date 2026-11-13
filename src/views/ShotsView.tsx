import React, { useCallback, useEffect, useState } from "react";
import { Accordion } from "../components/Accordion";
import { ClearButton } from "../components/common";
import ShotCard from "../components/ShotCard";
import ShotForm from "../components/ShotForm/ShotForm";
import ShotList from "../components/ShotList/ShotList";
import ShotMap from "../components/ShotMap/ShotMap";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useUndoableList } from "../hooks/useUndoableList";
import { useUrlState } from "../hooks/useUrlState";
import QuickShotSheet from "../components/QuickShotSheet/QuickShotSheet";
import { Team } from "../types/common";
import { Shot, ShotResult } from "../types/Shot";
import {
  loadQuickMode,
  loadShotDefaults,
  saveQuickMode,
  saveShotDefaults,
  ShotDefaults,
} from "../utils/shotEntryPrefs";

const DISPLAY_FILTERS = ["all", "home", "away"] as const;
type DisplayFilter = (typeof DISPLAY_FILTERS)[number];
const SHOTS_VIEWS = ["pitch", "list"] as const;
type ShotsView = (typeof SHOTS_VIEWS)[number];
const PITCH_VIEWS = ["full", "half"] as const;
type PitchView = (typeof PITCH_VIEWS)[number];

interface ShotsViewProps {
  shots: Shot[];
  setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
}

const ShotsView: React.FC<ShotsViewProps> = ({ shots, setShots }) => {
  // Choices last used in the form (team, body part, type, player); sticky
  // regardless of the display filter and remembered across reloads
  const [shotDefaults, setShotDefaults] =
    useState<ShotDefaults>(loadShotDefaults);
  const [isQuickMode, setIsQuickMode] = useState<boolean>(loadQuickMode);

  const [shotsView, setShotsView] = useUrlState<ShotsView>(
    "view",
    "pitch",
    SHOTS_VIEWS,
  );
  const [shotDisplayFilter, setShotDisplayFilter] = useUrlState<DisplayFilter>(
    "filter",
    "all",
    DISPLAY_FILTERS,
  );
  const [pitchView, setPitchView] = useUrlState<PitchView>(
    "pitch",
    "full",
    PITCH_VIEWS,
  );

  const [currentShotIndex, setCurrentShotIndex] = useState(0);

  const shotList = useUndoableList(shots, setShots, {
    one: "Shot",
    many: "shots",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickSheetOpen, setIsQuickSheetOpen] = useState(false);
  const [currentShotCoords, setCurrentShotCoords] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // A Home/Away filter pre-selects that team; "All" keeps the last-used team
  const formDefaultTeam: Team =
    shotDisplayFilter === "all" ? shotDefaults.team : shotDisplayFilter;

  // Shot filtering
  const filteredShots = shots.filter((shot) => {
    if (shotDisplayFilter === "all") return true;
    return shot.team === shotDisplayFilter;
  });

  // Modal/interaction handlers
  const handlePitchClick = (x: number, y: number) => {
    console.log(`Pitch clicked at: x=${x}, y=${y}`);
    setCurrentShotCoords({ x, y });
    if (isQuickMode) {
      setIsQuickSheetOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleToggleQuickMode = () => {
    const next = !isQuickMode;
    setIsQuickMode(next);
    saveQuickMode(next);
  };

  // Quick mode: one tap on a result saves the shot with the remembered choices
  const handleQuickResult = (result: ShotResult) => {
    handleAddShot({
      x: currentShotCoords.x,
      y: currentShotCoords.y,
      isGoal: result === "Goal",
      result,
      bodyPart: shotDefaults.bodyPart,
      shotType: shotDefaults.shotType,
      team: formDefaultTeam,
      playerName: shotDefaults.playerName.trim() || undefined,
    });
    setIsQuickSheetOpen(false);
  };

  const handleQuickMoreDetails = () => {
    setIsQuickSheetOpen(false);
    setIsModalOpen(true);
  };

  // Shot "CRUD" operations
  const handleAddShot = (details: Omit<Shot, "id" | "timestamp">) => {
    const newShot: Shot = {
      ...details,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
    };
    shotList.add(newShot);
    const nextDefaults: ShotDefaults = {
      team: details.team,
      bodyPart: details.bodyPart,
      shotType: details.shotType,
      playerName: details.playerName ?? "",
    };
    setShotDefaults(nextDefaults);
    saveShotDefaults(nextDefaults);
    console.log("Added shot:", newShot);
  };

  const handleRemoveShot = shotList.remove;
  const handleClearAllShots = shotList.clearAll;

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
          onClick={() => setShotDisplayFilter("all")}
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
          onClick={() => setShotDisplayFilter("home")}
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
          onClick={() => setShotDisplayFilter("away")}
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

  // Its own short row: the filter row has no room left at phone width.
  // ShotMap reserves the extra height so the pitch still fits on screen.
  const quickEntryToggleUI = (
    <div className="-mt-2 mb-2 flex h-6 justify-center">
      <button
        type="button"
        role="switch"
        aria-checked={isQuickMode}
        onClick={handleToggleQuickMode}
        className="flex items-center gap-2 rounded-full px-2 text-sm font-medium text-gray-800"
      >
        <span
          aria-hidden="true"
          className={`relative inline-block h-4 w-7 rounded-full transition-colors ${
            isQuickMode ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
              isQuickMode ? "translate-x-3" : ""
            }`}
          />
        </span>
        ⚡ Quick entry
      </button>
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
      {shotsView === "pitch" && quickEntryToggleUI}

      {shotsView === "pitch" ? (
        <>
          {/* In half view both teams attack the top goal, so the HOME/AWAY
              labels are hidden. Taps there are stored as top-half (y 0-50)
              coordinates regardless of the selected team. */}
          <div className="relative flex min-h-6 items-end justify-center">
            {pitchView === "full" && (
              <p className="text-center text-base text-black md:text-lg lg:text-xl">
                HOME
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                setPitchView(pitchView === "full" ? "half" : "full")
              }
              className="absolute right-0 bottom-0 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
            >
              {pitchView === "full" ? "Half pitch" : "Full pitch"}
            </button>
          </div>
          <ShotMap
            onPitchClick={handlePitchClick}
            shots={filteredShots}
            variant={pitchView === "half" ? "half-top" : "full"}
          />
          {pitchView === "full" && (
            <p className="text-center text-base text-black md:text-lg lg:text-xl">
              AWAY
            </p>
          )}
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
        defaultTeam={formDefaultTeam}
        defaultBodyPart={shotDefaults.bodyPart}
        defaultShotType={shotDefaults.shotType}
        defaultPlayerName={shotDefaults.playerName}
      />
      <QuickShotSheet
        isOpen={isQuickSheetOpen}
        onClose={() => setIsQuickSheetOpen(false)}
        onSelectResult={handleQuickResult}
        onMoreDetails={handleQuickMoreDetails}
        defaults={{ ...shotDefaults, team: formDefaultTeam }}
      />
    </>
  );
};

export default ShotsView;
