import React, { useEffect, useState } from "react";
import { Team } from "../../types/common";
import { TeamNames } from "../../types/Match";
import { BodyPart, Shot, ShotResult, ShotType } from "../../types/Shot";
import {
  getCancelButtonStyle,
  getSecondaryButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import { getShotResult } from "../../utils/shotResult";
import { DEFAULT_TEAM_LABELS, getTeamOptions } from "../../utils/teamLabels";
import Modal from "../Modal";
import SegmentedControl, { SegmentedOption } from "../SegmentedControl";

const RESULT_OPTIONS: SegmentedOption<ShotResult>[] = [
  { value: "Miss", label: "Miss", icon: "❌" },
  { value: "Saved", label: "Saved", icon: "🧤" },
  { value: "Blocked", label: "Blocked", icon: "🛑" },
  { value: "Goal", label: "Goal", icon: "⚽" },
];

const BODY_PART_OPTIONS: SegmentedOption<BodyPart>[] = [
  { value: "Foot", label: "Foot", icon: "👟" },
  { value: "Head", label: "Head", icon: "👤" },
  { value: "Other", label: "Other", icon: "🦵" },
];

const SHOT_TYPE_OPTIONS: SegmentedOption<ShotType>[] = [
  { value: "Open Play", label: "Open Play" },
  { value: "Set Piece", label: "Set Piece" },
  { value: "Penalty", label: "Penalty" },
];

interface ShotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<Shot, "id" | "timestamp">) => void;
  initialCoords: { x: number; y: number };
  defaultTeam?: Team;
  /** Remembered choices pre-selected when the form opens. */
  defaultBodyPart?: BodyPart;
  defaultShotType?: ShotType;
  defaultPlayerName?: string;
  /** Edit mode: the form starts from this shot and offers Save / Delete. */
  shot?: Shot;
  /** Edit mode: deletes the shot (the parent closes the form). */
  onDelete?: () => void;
  /** Labels of the team buttons; defaults to Home / Away. */
  teamNames?: TeamNames;
}

const ShotForm: React.FC<ShotFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoords,
  defaultTeam = "home",
  defaultBodyPart = "Foot",
  defaultShotType = "Open Play",
  defaultPlayerName = "",
  shot,
  onDelete,
  teamNames = DEFAULT_TEAM_LABELS,
}) => {
  const [result, setResult] = useState<ShotResult>("Miss");
  const [bodyPart, setBodyPart] = useState<BodyPart>(defaultBodyPart);
  const [shotType, setShotType] = useState<ShotType>(defaultShotType);
  const [playerName, setPlayerName] = useState<string>(defaultPlayerName);
  const [team, setTeam] = useState<Team>(defaultTeam);
  const isGoal = result === "Goal";

  // Reset form when it opens with new coordinates: the result goes back to
  // Miss (it differs every shot), the rest starts from the remembered choices
  useEffect(() => {
    if (isOpen) {
      setResult("Miss");
      setBodyPart(defaultBodyPart);
      setShotType(defaultShotType);
      setPlayerName(defaultPlayerName);
      setTeam(defaultTeam);
    }
  }, [
    isOpen,
    initialCoords,
    defaultTeam,
    defaultBodyPart,
    defaultShotType,
    defaultPlayerName,
  ]);

  // Edit mode: start from the shot being edited instead (runs after the reset)
  useEffect(() => {
    if (isOpen && shot) {
      setResult(getShotResult(shot));
      setBodyPart(shot.bodyPart);
      setShotType(shot.shotType);
      setPlayerName(shot.playerName ?? "");
      setTeam(shot.team);
    }
  }, [
    isOpen,
    shot,
    initialCoords,
    defaultTeam,
    defaultBodyPart,
    defaultShotType,
    defaultPlayerName,
  ]);

  if (!isOpen) {
    return null;
  }

  const teamOptions = getTeamOptions(teamNames);

  // Create a safer wrapper function that handles the iOS Safari issue
  const handleShotAdd = () => {
    onSubmit({
      x: initialCoords.x,
      y: initialCoords.y,
      isGoal,
      result,
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
      title={shot ? "Edit shot" : "New Shot"}
      onClose={onClose}
    >
      <form>
        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-600">Team:</label>
          <SegmentedControl
            ariaLabel="Team"
            options={teamOptions}
            value={team}
            onChange={setTeam}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-600">Result:</label>
          <SegmentedControl
            ariaLabel="Result"
            options={RESULT_OPTIONS}
            value={result}
            onChange={setResult}
            columns={2}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-600">
            Body Part:
          </label>
          <SegmentedControl
            ariaLabel="Body part"
            options={BODY_PART_OPTIONS}
            value={bodyPart}
            onChange={setBodyPart}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-600">
            Shot Type:
          </label>
          <SegmentedControl
            ariaLabel="Shot type"
            options={SHOT_TYPE_OPTIONS}
            value={shotType}
            onChange={setShotType}
          />
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
            {shot ? "Save" : "Add Shot"}
          </button>
          {shot && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className={getCancelButtonStyle()}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={
              shot ? getSecondaryButtonStyle() : getCancelButtonStyle()
            }
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ShotForm;
