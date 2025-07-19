import React, { useEffect, useState } from "react";
import {
  Action,
  ActionCategory,
  ActionOutcome,
  ActionType,
} from "../../types/Action";
import {
  getActionFormButtonStyle,
  getCancelButtonStyle,
  getOutcomeButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import Modal from "../Modal";

type ActionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<Action, "id" | "timestamp">) => void;
  initialCoords: { x: number; y: number };
};

const ActionForm: React.FC<ActionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoords,
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

  // Update outcome when action type changes
  useEffect(() => {
    // Set default outcome based on action type
    switch (selectedAction) {
      case "shot":
        setSelectedOutcome("goal");
        break;
      case "tackle":
        setSelectedOutcome("won");
        break;
      case "block":
        setSelectedOutcome("posession-won");
        break;
      case "clearance":
        setSelectedOutcome("cleared");
        break;
      default:
        setSelectedOutcome("successful");
    }
  }, [selectedAction]);

  if (!isOpen) {
    return null;
  }

  const handleCategoryChange = (category: ActionCategory) => {
    setSelectedCategory(category);
    switch (category) {
      case "attacking":
        setSelectedAction("pass");
        break;
      case "defensive":
        setSelectedAction("tackle");
        break;
      case "duel":
        setSelectedAction("aerial");
        break;
    }
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

  // Helper to render outcome buttons based on action type
  const renderOutcomeButtons = () => {
    switch (selectedAction) {
      case "pass":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("assist")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "assist")}`}
            >
              🅰️ Assist
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("key-pass")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "key-pass")}`}
            >
              🔑 Key Pass
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      case "cross":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("assist")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "assist")}`}
            >
              🅰️ Assist
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("key-pass")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "key-pass")}`}
            >
              🔑 Key Pass
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      case "dribble":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      case "shot":
        return (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("goal")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "goal")}`}
            >
              ⚽ Goal
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("on-target")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "on-target")}`}
            >
              🎯 On Target
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("off-target")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "off-target", true)}`}
            >
              ↪️ Off Target
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("blocked")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "blocked", true)}`}
            >
              🛑 Blocked
            </button>
          </div>
        );
      case "throw-in":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      case "tackle":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("won")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "won")}`}
            >
              ✅ Won
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("lost")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "lost", true)}`}
            >
              ❌ Lost
            </button>
          </div>
        );
      case "block":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("posession-won")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "posession-won")}`}
            >
              🔄 Possession Won
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      case "interception":
        return (
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
          </div>
        );
      case "clearance":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("cleared")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "cleared")}`}
            >
              🧹 Cleared
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      case "other":
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
      default:
        return (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("successful")}
              className={`flex flex-1 items-center justify-center rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "successful")}`}
            >
              ✅ Successful
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("unsuccessful")}
              className={`flex flex-1 items-center justify-center rounded px-4 py-2 text-sm ${getOutcomeButtonStyle(selectedOutcome === "unsuccessful", true)}`}
            >
              ❌ Unsuccessful
            </button>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} title="Record Player Action">
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedCategory === "attacking")}`}
              onClick={() => handleCategoryChange("attacking")}
            >
              Attacking
            </button>
            <button
              type="button"
              className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedCategory === "defensive")}`}
              onClick={() => handleCategoryChange("defensive")}
            >
              Defensive
            </button>
            <button
              type="button"
              className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedCategory === "duel")}`}
              onClick={() => handleCategoryChange("duel")}
            >
              Duel
            </button>
          </div>
        </div>

        {/* Action Type Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Action Type</label>

          {/* Attacking action buttons */}
          {selectedCategory === "attacking" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction("pass")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "pass")}`}
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("cross")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "cross")}`}
              >
                Cross
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("dribble")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "dribble")}`}
              >
                Dribble
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("shot")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "shot")}`}
              >
                Shot
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("throw-in")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "throw-in")}`}
              >
                Throw-in
              </button>
            </div>
          )}

          {/* Defensive action buttons */}
          {selectedCategory === "defensive" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction("tackle")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "tackle")}`}
              >
                Tackle
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("block")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "block")}`}
              >
                Block
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("interception")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "interception")}`}
              >
                Interception
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("clearance")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "clearance")}`}
              >
                Clearance
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("other")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "other")}`}
              >
                Other
              </button>
            </div>
          )}

          {/* Duel action buttons */}
          {selectedCategory === "duel" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction("aerial")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "aerial")}`}
              >
                Aerial Duel
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction("ground")}
                className={`rounded px-4 py-2 text-sm ${getActionFormButtonStyle(selectedCategory, selectedAction === "ground")}`}
              >
                Ground Duel
              </button>
            </div>
          )}
        </div>

        {/* Outcome Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Outcome</label>
          {renderOutcomeButtons()}
        </div>

        {/* Submit Buttons */}
        <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row">
          <button type="submit" className={getSubmitButtonStyle()}>
            Record Action
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

export default ActionForm;
