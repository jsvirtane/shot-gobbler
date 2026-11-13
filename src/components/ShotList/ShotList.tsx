import React from "react";
import { Shot } from "../../types/Shot";
import { formatEventTime } from "../../utils/matchClock";
import { getShotResult, shotResultTextColors } from "../../utils/shotResult";
import { formatXg, shotXg } from "../../utils/xg";
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
                    className={`${shotResultTextColors[getShotResult(shot)]} text-base capitalize`}
                  >
                    {getShotResult(shot).toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {[formatEventTime(shot), shot.shotType]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-right text-sm text-gray-600">
                    <span className="block text-base font-semibold text-gray-900">
                      {formatXg(shotXg(shot))}
                    </span>
                    xG
                  </span>
                  <RemoveItemButton
                    onClick={() => onRemoveShot(shot.id)}
                    title="Remove this shot"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ShotList;
