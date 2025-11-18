import React, { useCallback, useState } from "react";
import { ClearButton } from "../components/common";
import Modal from "../components/Modal/Modal";
import PassChainForm from "../components/PassChainForm/PassChainForm";
import PassChainsListView from "../components/PassChainsListView/PassChainsListView";
import PassChainsPitchView from "../components/PassChainsPitchView/PassChainsPitchView";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useUrlState } from "../hooks/useUrlState";
import {
  ChainAction,
  ChainActionType,
  ChainTerminationReason,
  PassChain,
} from "../types/PassChain";
import {
  getZoneFromCoordinates,
  getZonesFromPassChain,
} from "../utils/pitchZones";

type PassChainsView = "pitch" | "list";

const viewOptions = [
  { id: "pitch", label: "Pitch View", icon: "⚽️" },
  { id: "list", label: "List View", icon: "📋" },
];

interface PassChainsViewProps {
  passChains: PassChain[];
  setPassChains: React.Dispatch<React.SetStateAction<PassChain[]>>;
}

const PassChainsView: React.FC<PassChainsViewProps> = ({
  passChains,
  setPassChains,
}) => {
  const [currentView, setCurrentView] = useUrlState<PassChainsView>(
    "view",
    "pitch",
  );
  const [selectedActionType, setSelectedActionType] =
    useState<ChainActionType>("start");

  const [currentPassChain, setCurrentPassChain] = useState<ChainAction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isActivePassChain = currentPassChain.length > 0;

  const handlePitchClick = (x: number, y: number) => {
    console.log(`Pitch clicked at: x=${x}, y=${y}`);

    setCurrentPassChain((prevChain) => {
      const isFirstAction = prevChain.length === 0;
      const actionType = isFirstAction ? "start" : selectedActionType;

      const newAction = {
        x,
        y,
        sequenceNumber: prevChain.length,
        actionType,
        pitchZone: getZoneFromCoordinates({ x, y }),
      };

      return [...prevChain, newAction];
    });

    // After first action, automatically switch to "pass" if still on "start"
    if (currentPassChain.length === 0 && selectedActionType === "start") {
      setSelectedActionType("pass");
    }
  };

  const handleEndChain = () => {
    if (currentPassChain.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleFormSubmit = (data: {
    terminationReason: ChainTerminationReason;
  }) => {
    if (currentPassChain.length > 0) {
      const newChain: PassChain = {
        id: `chain-${Date.now()}`,
        actions: currentPassChain,
        terminationReason: data.terminationReason,
        isCompleted: true,
        zones: getZonesFromPassChain(currentPassChain),
      };

      setPassChains((prevChains) => [...prevChains, newChain]);
      setCurrentPassChain([]);
      setIsModalOpen(false);
      setSelectedActionType("start"); // Reset
    }
  };

  const handleClearCurrentChain = () => {
    setCurrentPassChain([]);
    setSelectedActionType("start"); // Reset to start when clearing
  };

  const handleUndoLastAction = () => {
    setCurrentPassChain((prevChain) => prevChain.slice(0, -1));
  };

  const handleClearAllPassChains = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all pass chains? This cannot be undone.",
      )
    ) {
      setPassChains([]);
      console.log("Cleared all pass chains");
    }
  }, [setPassChains]);

  const handleRemovePassChain = useCallback(
    (chainId: string) => {
      setPassChains((prevChains) =>
        prevChains.filter((chain) => chain.id !== chainId),
      );
    },
    [setPassChains],
  );

  return (
    <>
      {!isActivePassChain && (
        <>
          <ViewToggle
            currentView={currentView}
            options={viewOptions}
            onViewChange={(view) => setCurrentView(view as PassChainsView)}
            className="mb-4"
          />
        </>
      )}

      {currentView === "pitch" ? (
        <PassChainsPitchView
          passChains={passChains}
          currentPassChain={currentPassChain}
          selectedActionType={selectedActionType}
          onPitchClick={handlePitchClick}
          onActionTypeChange={setSelectedActionType}
          onEndChain={handleEndChain}
          onUndoLastAction={handleUndoLastAction}
          onClearCurrentChain={handleClearCurrentChain}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <PassChainsListView
            passChains={passChains}
            onRemovePassChain={handleRemovePassChain}
          />
          {passChains.length > 0 && (
            <ClearButton
              onClick={handleClearAllPassChains}
              data-testid="clear-all"
            >
              Clear All Pass Chains
            </ClearButton>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} title="Complete Pass Chain" maxWidth="500px">
        <PassChainForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default PassChainsView;
