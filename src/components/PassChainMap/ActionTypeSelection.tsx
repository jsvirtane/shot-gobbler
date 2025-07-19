import React from "react";
import { ChainActionType } from "../../types/PassChain";
import { SaveChainButton } from "./SaveChainButton";

type ActionTypeSelectionProps = {
  selectedActionType: ChainActionType;
  onActionTypeChange: (actionType: ChainActionType) => void;
  onEndChain: () => void;
  className?: string;
};

const actionTypeOptions: {
  id: ChainActionType;
  label: string;
}[] = [
  { id: "pass", label: "Pass" },
  { id: "carry", label: "Carry" },
  { id: "shot", label: "Shot" },
  { id: "cross", label: "Cross" },
];

const ActionTypeSelection: React.FC<ActionTypeSelectionProps> = ({
  selectedActionType,
  onActionTypeChange,
  onEndChain,
  className = "",
}) => {
  return (
    <div className={`flex justify-between ${className}`}>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {actionTypeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onActionTypeChange(option.id)}
            className={`border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              selectedActionType === option.id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            } ${
              option.id === actionTypeOptions[0].id
                ? "rounded-l-lg"
                : option.id ===
                    actionTypeOptions[actionTypeOptions.length - 1].id
                  ? "rounded-r-lg border-l-0"
                  : "border-l-0"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SaveChainButton onEndChain={onEndChain} />
    </div>
  );
};

export default ActionTypeSelection;
