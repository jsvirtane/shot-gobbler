import React, { useEffect, useState } from "react";
import {
  Action,
  ActionCategory,
  ActionOutcome,
  ActionType,
} from "../../types/Action";
import { ActionFormColors } from "../../constants/actionFormColors";
import { ACTION_OUTCOMES, actionTypesIn } from "../../constants/actionTypes";
import {
  getCancelButtonStyle,
  getSecondaryButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import { parseMinuteInput } from "../../utils/matchClock";
import { MinuteInput } from "../common/MinuteInput";
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
const actionTypeOptions = (
  category: ActionCategory,
): SegmentedOption<ActionType>[] =>
  actionTypesIn(category).map(({ value, label }) => ({ value, label }));

type OutcomeGroup = {
  options: SegmentedOption<ActionOutcome>[];
  columns: 1 | 2 | 3;
};

/** Outcomes of an action type; the first one is selected by default. */
const outcomeGroup = (type: ActionType): OutcomeGroup => {
  const outcomes = ACTION_OUTCOMES[type];
  return {
    options: outcomes.map(({ value, label, icon, tone }) => ({
      value,
      label,
      icon,
      activeClassName:
        tone === "failure"
          ? ActionFormColors.outcome.active.unsuccessful
          : ActionFormColors.outcome.active.successful,
    })),
    columns: outcomes.length === 1 ? 1 : type === "shot" ? 3 : 2,
  };
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
  /** Match minute from the clock; the user can change it. */
  defaultMinute?: number;
};

const ActionForm: React.FC<ActionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoords,
  action,
  onDelete,
  defaultMinute,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<ActionCategory>("attacking");
  const [selectedAction, setSelectedAction] = useState<ActionType>("pass");
  const [selectedOutcome, setSelectedOutcome] =
    useState<ActionOutcome>("successful");
  const [minute, setMinute] = useState("");

  // Reset form when it opens with new coordinates
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory("attacking");
      setSelectedAction("pass");
      setSelectedOutcome("successful");
      setMinute(defaultMinute?.toString() ?? "");
    }
  }, [isOpen, initialCoords, defaultMinute]);

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
    setSelectedOutcome(ACTION_OUTCOMES[action][0].value);
  };

  // Changing the category picks its first action type
  const handleCategoryChange = (category: ActionCategory) => {
    setSelectedCategory(category);
    handleActionChange(actionTypesIn(category)[0].value);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      x: initialCoords.x,
      y: initialCoords.y,
      category: selectedCategory,
      actionType: selectedAction,
      outcome: selectedOutcome,
      ...parseMinuteInput(minute),
    });
    onClose();
  };

  const outcomes = outcomeGroup(selectedAction);

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
            options={actionTypeOptions(selectedCategory)}
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

        <MinuteInput value={minute} onChange={setMinute} />

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
