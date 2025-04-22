import React, { useEffect, useState } from "react";
import { BodyPart, Shot, ShotType, Team } from "../../types/Shot";

interface ShotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<Shot, "id" | "timestamp">) => void;
  initialCoords: { x: number; y: number };
  defaultTeam?: Team;
}

const ShotForm: React.FC<ShotFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoords,
  defaultTeam = "home",
}) => {
  const [isGoal, setIsGoal] = useState<boolean>(false);
  const [bodyPart, setBodyPart] = useState<BodyPart>("Foot");
  const [shotType, setShotType] = useState<ShotType>("Open Play");
  const [playerName, setPlayerName] = useState<string>("");
  const [team, setTeam] = useState<Team>(defaultTeam);

  // Reset form when it opens with new coordinates
  useEffect(() => {
    if (isOpen) {
      setIsGoal(false);
      setBodyPart("Foot");
      setShotType("Open Play");
      setPlayerName("");
      setTeam(defaultTeam);
    }
  }, [isOpen, initialCoords, defaultTeam]); // Depend on isOpen, coords, and defaultTeam

  if (!isOpen) {
    return null;
  }

  // Create a safer wrapper function that handles the iOS Safari issue
  const handleShotAdd = () => {
    onSubmit({
      x: initialCoords.x,
      y: initialCoords.y,
      isGoal,
      bodyPart,
      shotType,
      team,
      playerName: playerName.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
      <div className="z-[1001] w-[90%] max-w-[400px] rounded-lg bg-white p-6 shadow-lg sm:p-8">
        <h2 className="mt-0 mb-5 text-center text-[1.4em] text-gray-800">
          Shot Details at ({initialCoords.x.toFixed(1)}%,{" "}
          {initialCoords.y.toFixed(1)}%)
        </h2>
        <form>
          <div className="mb-4">
            <label className="mb-1 block font-bold text-gray-600">Team:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTeam("home")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  team === "home"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                🏠 Home
              </button>
              <button
                type="button"
                onClick={() => setTeam("away")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  team === "away"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                🚌 Away
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block font-bold text-gray-600">
              Result:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsGoal(false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  !isGoal
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                ❌ Miss
              </button>
              <button
                type="button"
                onClick={() => setIsGoal(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  isGoal
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                ⚽ Goal
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block font-bold text-gray-600">
              Body Part:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBodyPart("Foot")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  bodyPart === "Foot"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                👟 Foot
              </button>
              <button
                type="button"
                onClick={() => setBodyPart("Head")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  bodyPart === "Head"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                👤 Head
              </button>
              <button
                type="button"
                onClick={() => setBodyPart("Other")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  bodyPart === "Other"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                🦵 Other
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block font-bold text-gray-600">
              Shot Type:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShotType("Open Play")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  shotType === "Open Play"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Open Play
              </button>
              <button
                type="button"
                onClick={() => setShotType("Set Piece")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  shotType === "Set Piece"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Set Piece
              </button>
              <button
                type="button"
                onClick={() => setShotType("Penalty")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${
                  shotType === "Penalty"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Penalty
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="playerName"
              className="mb-1 block font-bold text-gray-600"
            >
              Player Name/Number (Optional):
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g., Ronaldo or 7"
              className="w-full rounded-md border border-gray-300 p-2.5 text-base"
            />
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row">
            <button
              type="button"
              className="min-w-[120px] rounded-md bg-green-600 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-green-700"
              onClick={handleShotAdd}
            >
              Add Shot
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[120px] rounded-md bg-red-600 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShotForm;
