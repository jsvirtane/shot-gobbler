import React from "react";
import { ChainAction, ChainActionType, PassChain } from "../../types/PassChain";
import ActionTypeSelection from "../PassChainMap/ActionTypeSelection";
import { PassChainMap } from "../PassChainMap/PassChainMap";

type PassChainsPitchViewProps = {
  passChains: PassChain[];
  currentPassChain: ChainAction[];
  selectedActionType: ChainActionType;
  onPitchClick: (x: number, y: number) => void;
  onActionTypeChange: (actionType: ChainActionType) => void;
  onEndChain: () => void;
  onUndoLastAction: () => void;
  onClearCurrentChain: () => void;
};

const PassChainsPitchView: React.FC<PassChainsPitchViewProps> = ({
  passChains,
  currentPassChain,
  selectedActionType,
  onPitchClick,
  onActionTypeChange,
  onEndChain,
  onUndoLastAction,
  onClearCurrentChain,
}) => {
  const isActivePassChain = currentPassChain.length > 0;

  return (
    <>
      {!isActivePassChain && passChains.length === 0 && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-blue-800">
            <strong>Click on the pitch to start a new pass chain.</strong>
            <br />
            The first action will automatically be marked as the start position.
          </p>
        </div>
      )}

      {isActivePassChain && currentPassChain.length > 0 && (
        <>
          <ActionTypeSelection
            selectedActionType={selectedActionType}
            onActionTypeChange={onActionTypeChange}
            onEndChain={onEndChain}
            className="mb-4"
          />
        </>
      )}

      <PassChainMap
        onPitchClick={onPitchClick}
        passChains={passChains}
        currentPassChain={currentPassChain}
      />

      {isActivePassChain && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onUndoLastAction}
            disabled={currentPassChain.length === 0}
            className="focus:ring-opacity-50 rounded-lg border-2 border-orange-200 bg-orange-50 px-6 py-3 text-orange-700 transition-all hover:border-orange-300 hover:bg-orange-100 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            title="Undo last action"
          >
            <span className="flex items-center">Undo Last Action</span>
          </button>
          <button
            onClick={onClearCurrentChain}
            className="focus:ring-opacity-50 rounded-lg border-2 border-red-200 bg-red-50 px-6 py-3 text-red-700 transition-all hover:border-red-300 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
            title="Clear current pass chain"
          >
            <span className="flex items-center">Clear Current Chain</span>
          </button>
        </div>
      )}
    </>
  );
};

export default PassChainsPitchView;
