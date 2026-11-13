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
  /** Saved chain selected by tapping one of its markers. */
  selectedChainId?: string | null;
  onChainClick?: (id: string) => void;
  onDeleteSelectedChain?: () => void;
  onCloseSelection?: () => void;
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
  selectedChainId,
  onChainClick,
  onDeleteSelectedChain,
  onCloseSelection,
}) => {
  const isActivePassChain = currentPassChain.length > 0;
  const selectedIndex = passChains.findIndex((c) => c.id === selectedChainId);
  const selectedChain = selectedIndex === -1 ? null : passChains[selectedIndex];

  return (
    <>
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

      {selectedChain && !isActivePassChain && (
        <div
          role="toolbar"
          aria-label="Selected pass chain"
          className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
        >
          <span className="text-sm font-medium text-gray-800">
            Chain {selectedIndex + 1} · {selectedChain.actions.length}{" "}
            {selectedChain.actions.length === 1 ? "point" : "points"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDeleteSelectedChain}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete chain
            </button>
            <button
              type="button"
              onClick={onCloseSelection}
              className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <PassChainMap
        onPitchClick={onPitchClick}
        passChains={passChains}
        currentPassChain={currentPassChain}
        selectedChainId={selectedChain?.id}
        onChainClick={onChainClick}
        hint={
          !isActivePassChain &&
          passChains.length === 0 && (
            <>
              <strong>Click on the pitch to start a new pass chain.</strong>
              <br />
              The first action will automatically be marked as the start
              position.
            </>
          )
        }
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
