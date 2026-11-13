import React, { useEffect, useState } from "react";
import {
  Action,
  ActionCategory,
  ActionOutcome,
  ActionType,
} from "../../types/Action";
import { ActionFormColors } from "../../constants/actionFormColors";
import {
  getCancelButtonStyle,
  getSecondaryButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import Modal from "../Modal";
import SegmentedControl, { SegmentedOption } from "../SegmentedControl";

const CATEGORY_OPTIONS: SegmentedOption<ActionCategory>[] = (
  ["attacking", "defensive", "duel"] as const
).map((category) => ({
  value: category,
  label: category[0].toUpperCase() + category.slice(1),
  activeClassName: ActionFormColors.category[category].active,
}));

/** Action types per category; the first one is selected by default. */
const ACTION_TYPES: Record<ActionCategory, SegmentedOption<ActionType>[]> = {
  attacking: [
    { value: "pass", label: "Pass" },
    { value: "cross", label: "Cross" },
    { value: "dribble", label: "Dribble" },
    { value: "shot", label: "Shot" },
    { value: "throw-in", label: "Throw-in" },
  ],
  defensive: [
    { value: "tackle", label: "Tackle" },
    { value: "block", label: "Block" },
    { value: "interception", label: "Interception" },
    { value: "clearance", label: "Clearance" },
    { value: "other", label: "Other" },
  ],
  duel: [
    { value: "aerial", label: "Aerial Duel" },
    { value: "ground", label: "Ground Duel" },
  ],
};

const outcome = (
  value: ActionOutcome,
  label: string,
  icon: string,
  successful = true,
): SegmentedOption<ActionOutcome> => ({
  value,
  label,
  icon,
  activeClassName: successful
    ? ActionFormColors.outcome.active.successful
    : ActionFormColors.outcome.active.unsuccessful,
});

const SUCCESSFUL = outcome("successful", "Successful", "✅");
const UNSUCCESSFUL = outcome("unsuccessful", "Unsuccessful", "❌", false);
type OutcomeGroup = {
  options: SegmentedOption<ActionOutcome>[];
  columns: 1 | 2 | 3;
};

const SUCCESS_OR_NOT: OutcomeGroup = {
  options: [SUCCESSFUL, UNSUCCESSFUL],
  columns: 2,
};
const PASS_OUTCOMES: OutcomeGroup = {
  options: [
    SUCCESSFUL,
    UNSUCCESSFUL,
    outcome("assist", "Assist", "🅰️"),
    outcome("key-pass", "Key Pass", "🔑"),
  ],
  columns: 2,
};

/** Outcomes per action type; the first one is selected by default. */
const OUTCOMES: Record<ActionType, OutcomeGroup> = {
  pass: PASS_OUTCOMES,
  cross: PASS_OUTCOMES,
  dribble: SUCCESS_OR_NOT,
  shot: {
    options: [
      outcome("goal", "Goal", "⚽"),
      outcome("on-target", "On Target", "🎯"),
      outcome("off-target", "Off Target", "↪️", false),
      outcome("blocked", "Blocked", "🛑", false),
    ],
    columns: 3,
  },
  "throw-in": SUCCESS_OR_NOT,
  tackle: {
    options: [
      outcome("won", "Won", "✅"),
      outcome("lost", "Lost", "❌", false),
    ],
    columns: 2,
  },
  block: {
    options: [outcome("possession-won", "Possession Won", "🔄"), UNSUCCESSFUL],
    columns: 2,
  },
  interception: { options: [SUCCESSFUL], columns: 1 },
  clearance: {
    options: [outcome("cleared", "Cleared", "🧹"), UNSUCCESSFUL],
    columns: 2,
  },
  other: SUCCESS_OR_NOT,
  aerial: SUCCESS_OR_NOT,
  ground: SUCCESS_OR_NOT,
};

type ActionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<Action, "id" | "timestamp">) => void;
  initialCoords: { x: number; y: number };
  /** Edit mode: the form starts from this action and offers Save / Delete. */
  action?: Action;
  /** Edit mode: deletes the action (the parent closes the form). */
  onDelete?: () => void;
};

const ActionForm: React.FC<ActionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoords,
  action,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<ActionCategory>("attacking");
  const [selectedAction, setSelectedAction] = useState<ActionType>("pass");
  const [selectedOutcome, setSelectedOutcome] =
    useState<ActionOutcome>("successful");

  // Reset form when it opens with new coordinates
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory("attacking");
      setSelectedAction("pass");
      setSelectedOutcome("successful");
    }
  }, [isOpen, initialCoords]);

  // Edit mode: start from the action being edited instead (runs after the reset)
  useEffect(() => {
    if (isOpen && action) {
      setSelectedCategory(action.category);
      setSelectedAction(action.actionType);
      setSelectedOutcome(action.outcome);
    }
  }, [isOpen, initialCoords, action]);

  if (!isOpen) {
    return null;
  }

  // Changing the action type picks its first (default) outcome
  const handleActionChange = (action: ActionType) => {
    setSelectedAction(action);
    setSelectedOutcome(OUTCOMES[action].options[0].value);
  };

  // Changing the category picks its first action type
  const handleCategoryChange = (category: ActionCategory) => {
    setSelectedCategory(category);
    handleActionChange(ACTION_TYPES[category][0].value);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      x: initialCoords.x,
      y: initialCoords.y,
      category: selectedCategory,
      actionType: selectedAction,
      outcome: selectedOutcome,
    });
    onClose();
  };

  const outcomes = OUTCOMES[selectedAction];

  return (
    <Modal
      isOpen={isOpen}
      title={action ? "Edit action" : "Record Player Action"}
      onClose={onClose}
    >
      <p className="mb-4 text-sm text-gray-600">
        Position: ({initialCoords.x.toFixed(1)}%, {initialCoords.y.toFixed(1)}
        %)
      </p>

      <form onSubmit={handleActionSubmit}>
        {/* Category Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Action Category
          </label>
          <SegmentedControl
            ariaLabel="Action category"
            options={CATEGORY_OPTIONS}
            value={selectedCategory}
            onChange={handleCategoryChange}
            columns={3}
            size="sm"
            inactiveClassName={ActionFormColors.category.attacking.inactive}
          />
        </div>

        {/* Action Type Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Action Type</label>
          <SegmentedControl
            ariaLabel="Action type"
            options={ACTION_TYPES[selectedCategory]}
            value={selectedAction}
            onChange={handleActionChange}
            columns={2}
            size="sm"
            activeClassName={ActionFormColors.category[selectedCategory].active}
            inactiveClassName={
              ActionFormColors.category[selectedCategory].inactive
            }
          />
        </div>

        {/* Outcome Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Outcome</label>
          <SegmentedControl
            ariaLabel="Outcome"
            options={outcomes.options}
            value={selectedOutcome}
            onChange={setSelectedOutcome}
            columns={outcomes.columns}
            size="sm"
            inactiveClassName={ActionFormColors.outcome.inactive}
          />
        </div>

        {/* Submit Buttons */}
        <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row">
          <button type="submit" className={getSubmitButtonStyle()}>
            {action ? "Save" : "Record Action"}
          </button>
          {action && onDelete && (
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
              action ? getSecondaryButtonStyle() : getCancelButtonStyle()
            }
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ActionForm;
