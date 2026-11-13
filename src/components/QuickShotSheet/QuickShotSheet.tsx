import React from "react";
import { ShotResult } from "../../types/Shot";
import { ShotDefaults } from "../../utils/shotEntryPrefs";
import { formatTeam } from "../../utils/teamLabels";
import Modal from "../Modal";

interface QuickShotSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the tapped result; the parent saves the shot. */
  onSelectResult: (result: ShotResult) => void;
  /** Switches to the full shot form for the same pitch position. */
  onMoreDetails: () => void;
  /** The remembered choices the shot will be saved with. */
  defaults: ShotDefaults;
}

const RESULTS: { result: ShotResult; icon: string; className: string }[] = [
  {
    result: "Miss",
    icon: "❌",
    className: "bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    result: "Saved",
    icon: "🧤",
    className: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    result: "Blocked",
    icon: "🛑",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  },
  {
    result: "Goal",
    icon: "⚽",
    className: "bg-green-50 text-green-700 hover:bg-green-100",
  },
];

const BODY_PART_ICONS: Record<ShotDefaults["bodyPart"], string> = {
  Foot: "👟",
  Head: "👤",
  Other: "🦵",
};

const QuickShotSheet: React.FC<QuickShotSheetProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  onMoreDetails,
  defaults,
}) => {
  const summary = [
    formatTeam(defaults.team),
    `${BODY_PART_ICONS[defaults.bodyPart]} ${defaults.bodyPart}`,
    defaults.shotType,
    defaults.playerName.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal isOpen={isOpen} title="Quick Shot" onClose={onClose}>
      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Result">
        {RESULTS.map(({ result, icon, className }) => (
          <button
            key={result}
            type="button"
            onClick={() => onSelectResult(result)}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-3 text-sm font-semibold transition-colors ${className}`}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              {icon}
            </span>
            {result}
          </button>
        ))}
      </div>
      <p
        className="mt-4 text-center text-sm text-gray-600"
        data-testid="quick-shot-summary"
      >
        {summary}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onMoreDetails}
          className="py-2 font-medium text-blue-700 underline underline-offset-2"
        >
          More details…
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default QuickShotSheet;
