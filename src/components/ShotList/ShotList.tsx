import React from "react";
import { Shot } from "../../types/Shot";
import {
  ClearButton,
  ExportButton,
  ImportButton,
  RemoveItemButton,
} from "../common";

interface ShotListProps {
  shots: Shot[];
  onRemoveShot: (id: string) => void;
  onClearAllShots: () => void;
  onImportShots?: (shots: Shot[]) => void;
  displayFilter?: "all" | "home" | "away";
}

const ShotList: React.FC<ShotListProps> = ({
  shots,
  onRemoveShot,
  onClearAllShots,
  onImportShots = () => {},
  displayFilter = "all", // Default value
}) => {
  // Handle importing JSON data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedShots = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedShots) && importedShots.length > 0) {
          onImportShots(importedShots);
          console.log(`Imported ${importedShots.length} shots`);
        } else {
          alert("The imported file doesn't contain valid shot data.");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert(
          "Failed to parse the imported file. Please ensure it's valid JSON.",
        );
      }
      // Note: File input reset is handled by ImportButton component
    };
    reader.onerror = () => {
      alert("Error reading the file.");
    };
    reader.readAsText(file);
  };

  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p>No shots recorded yet. Click on the pitch to add one.</p>
        <div className="mt-4 flex flex-col items-center">
          {displayFilter === "all" && (
            <>
              <p>Or import a previously saved shot list:</p>
              <ImportButton onImport={handleImport}>
                Import Shot List
              </ImportButton>
            </>
          )}
        </div>
      </div>
    );
  }

  // Optional: Export Data Function
  const handleExportData = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(shots, null, 2), // Pretty print JSON
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `shots_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    console.log("Exporting data...");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Recorded Shots ({shots.length})
        </h3>
        <ul className="overflow-y-auto">
          {shots.map((shot) => (
            <li
              key={shot.id}
              className={`mb-2 border-l-3 p-3 ${shot.team === "home" ? "border-l-blue-600" : "border-l-red-600"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold uppercase">
                    {shot.bodyPart}{" "}
                    {shot.playerName && <span> ({shot.playerName}) </span>}
                  </span>
                  <p
                    className={` ${shot.isGoal ? "text-green-500" : "text-red-500"} text-base capitalize`}
                  >
                    {shot.isGoal ? "goal" : "miss"}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {shot.shotType}
                  </p>
                </div>

                <RemoveItemButton
                  onClick={() => onRemoveShot(shot.id)}
                  title="Remove this shot"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      {shots.length > 0 && displayFilter === "all" && (
        <div className="mt-4 flex flex-col space-y-2">
          <ExportButton onClick={handleExportData}>
            Export Data as JSON
          </ExportButton>
          <ClearButton onClick={onClearAllShots}>Clear All Shots</ClearButton>
        </div>
      )}
    </div>
  );
};

export default ShotList;
