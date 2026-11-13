import React from "react";
import { ChainActionType } from "../../types/PassChain";
import SegmentedControl, { SegmentedOption } from "../SegmentedControl";
import { SaveChainButton } from "./SaveChainButton";

type ActionTypeSelectionProps = {
  selectedActionType: ChainActionType;
  onActionTypeChange: (actionType: ChainActionType) => void;
  onEndChain: () => void;
  className?: string;
};

const actionTypeOptions: SegmentedOption<ChainActionType>[] = [
  { value: "pass", label: "Pass" },
  { value: "carry", label: "Carry" },
  { value: "shot", label: "Shot" },
  { value: "cross", label: "Cross" },
];

const ActionTypeSelection: React.FC<ActionTypeSelectionProps> = ({
  selectedActionType,
  onActionTypeChange,
  onEndChain,
  className = "",
}) => {
  return (
    <div className={`flex justify-between ${className}`}>
      <SegmentedControl
        variant="joined"
        size="sm"
        ariaLabel="Next action type"
        options={actionTypeOptions}
        value={selectedActionType}
        onChange={onActionTypeChange}
        inactiveClassName="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      />

      <SaveChainButton onEndChain={onEndChain} />
    </div>
  );
};

export default ActionTypeSelection;
