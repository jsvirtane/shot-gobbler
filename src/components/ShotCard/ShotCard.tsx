import React from "react";
import { Shot } from "../../types/Shot";

interface ShotCardProps {
  shot: Shot;
  currentIndex: number;
  totalShots: number;
  onNext: () => void;
  onPrevious: () => void;
}

const ShotCard: React.FC<ShotCardProps> = ({
  shot,
  currentIndex,
  totalShots,
  onNext,
  onPrevious,
}) => {
  const getResultColor = (result: Shot["result"]) => {
    switch (result) {
      case "Goal":
        return "text-green-600";
      case "Miss":
        return "text-red-600";
      case "Saved":
        return "text-orange-600";
      case "Blocked":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`rounded-lg border-2 ${shot.team === "home" ? "border-blue-600" : "border-red-600"} bg-white p-4 shadow-lg`}
    >
      {/* Header with navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={totalShots <= 1}
          className="rounded-full bg-gray-200 p-1 hover:bg-gray-300 active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
          title="Previous shot"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="text-center">
          {shot.playerName ? (
            <>
              <h3 className="text-lg font-bold">{shot.playerName}</h3>
              <span
                className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase ${shot.team === "home" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}
              >
                {shot.team} team
              </span>
            </>
          ) : (
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase ${shot.team === "home" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}
            >
              {shot.team} team
            </span>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={totalShots <= 1}
          className="rounded-full bg-gray-200 p-1 hover:bg-gray-300 active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
          title="Next shot"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Shot Details */}
      <div className="space-y-3">
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Result
            </p>
            <p
              className={`text-lg font-semibold ${getResultColor(shot.result)}`}
            >
              {shot.result}
            </p>
          </div>

          <div className="rounded bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Body Part
            </p>
            <p className="text-lg font-semibold">{shot.bodyPart}</p>
          </div>

          <div className="rounded bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Shot Type
            </p>
            <p className="text-lg font-semibold">{shot.shotType}</p>
          </div>

          <div className="rounded bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Position
            </p>
            <p className="text-sm font-medium">
              X: {shot.x.toFixed(1)}%, Y: {shot.y.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Shot counter */}
        <div className="border-t pt-2">
          <p className="text-center text-sm font-medium text-gray-600">
            Shot {currentIndex + 1} of {totalShots}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShotCard;
