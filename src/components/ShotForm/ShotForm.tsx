import React, { useEffect, useState } from "react";
import { Team } from "../../types/common";
import { BodyPart, Shot, ShotType } from "../../types/Shot";
import {
  getCancelButtonStyle,
  getShotFormButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import Modal from "../Modal";

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
    <Modal
      isOpen={isOpen}
      title={`Shot Details at (${initialCoords.x.toFixed(1)}%, ${initialCoords.y.toFixed(1)}%)`}
    >
      <form>
        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-600">Team:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTeam("home")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(team === "home")}`}
            >
              🏠 Home
            </button>
            <button
              type="button"
              onClick={() => setTeam("away")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(team === "away")}`}
            >
              🚌 Away
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-600">Result:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsGoal(false)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(isGoal === false)}`}
            >
              ❌ Miss
            </button>
            <button
              type="button"
              onClick={() => setIsGoal(true)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(isGoal === true)}`}
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
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(bodyPart === "Foot")}`}
            >
              👟 Foot
            </button>
            <button
              type="button"
              onClick={() => setBodyPart("Head")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(bodyPart === "Head")}`}
            >
              👤 Head
            </button>
            <button
              type="button"
              onClick={() => setBodyPart("Other")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(bodyPart === "Other")}`}
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
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(shotType === "Open Play")}`}
            >
              Open Play
            </button>
            <button
              type="button"
              onClick={() => setShotType("Set Piece")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(shotType === "Set Piece")}`}
            >
              Set Piece
            </button>
            <button
              type="button"
              onClick={() => setShotType("Penalty")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-base transition-colors ${getShotFormButtonStyle(shotType === "Penalty")}`}
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
            className={getSubmitButtonStyle()}
            onClick={handleShotAdd}
          >
            Add Shot
          </button>
          <button
            type="button"
            onClick={onClose}
            className={getCancelButtonStyle()}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ShotForm;
