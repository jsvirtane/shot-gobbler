import React, { useRef } from "react";
import { Shot } from "../../types/Shot";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      alert("Error reading the file.");
    };
    reader.readAsText(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p>No shots recorded yet. Click on the pitch to add one.</p>
        <div className="mt-4 flex flex-col items-center">
          <p>Or import a previously saved shot list:</p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={triggerFileInput}
            className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Import Shot List
          </button>
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

                <button
                  onClick={() => onRemoveShot(shot.id)}
                  className="h-5 w-5 cursor-pointer items-center justify-center rounded bg-red-500 hover:bg-red-600"
                  title="Remove this shot"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {shots.length > 0 && displayFilter === "all" && (
        <div className="mt-4 flex flex-col space-y-2">
          <button
            onClick={handleExportData}
            className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
          >
            Export Data as JSON
          </button>
          <button
            onClick={onClearAllShots}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Clear All Shots
          </button>
        </div>
      )}
    </div>
  );
};

export default ShotList;
