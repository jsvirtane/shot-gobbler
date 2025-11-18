import React from "react";
import { Shot } from "../../types/Shot";
import { RemoveItemButton } from "../common";

interface ShotListProps {
  shots: Shot[];
  onRemoveShot: (id: string) => void;
}

const ShotList: React.FC<ShotListProps> = ({ shots, onRemoveShot }) => {
  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p>No shots recorded yet. Click on the pitch to add one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4">
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
    </div>
  );
};

export default ShotList;
