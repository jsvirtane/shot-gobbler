import React, { useCallback, useEffect, useState } from "react";
import Modal from "../components/Modal/Modal";
import PassChainForm from "../components/PassChainForm/PassChainForm";
import PassChainsListView from "../components/PassChainsListView/PassChainsListView";
import PassChainsPitchView from "../components/PassChainsPitchView/PassChainsPitchView";
import ViewToggle from "../components/ViewToggle/ViewToggle";
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

const PASS_CHAINS_STORAGE_KEY = "shot-gobbler-pass-chains";

const viewOptions = [
  { id: "pitch", label: "Pitch View", icon: "⚽️" },
  { id: "list", label: "List View", icon: "📋" },
];

const PassChainsView: React.FC = () => {
  const [currentView, setCurrentView] = useState<PassChainsView>("pitch");
  const [selectedActionType, setSelectedActionType] =
    useState<ChainActionType>("start");

  const [passChains, setPassChains] = useState<PassChain[]>(() => {
    try {
      const storedChains = localStorage.getItem(PASS_CHAINS_STORAGE_KEY);
      return storedChains ? JSON.parse(storedChains) : [];
    } catch (error) {
      console.error("Error loading pass chains from localStorage:", error);
      return [];
    }
  });
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
  }, []);

  const handleImportPassChains = useCallback(
    (importedPassChains: PassChain[]) => {
      const passChainsWithNewIds = importedPassChains.map((chain) => ({
        ...chain,
        id: `chain-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      }));
      setPassChains((prevChains) => [...prevChains, ...passChainsWithNewIds]);
      console.log(`Imported ${importedPassChains.length} pass chains`);
    },
    [],
  );

  const handleRemovePassChain = useCallback((chainId: string) => {
    setPassChains((prevChains) =>
      prevChains.filter((chain) => chain.id !== chainId),
    );
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PASS_CHAINS_STORAGE_KEY, JSON.stringify(passChains));
    } catch (error) {
      console.error("Error saving pass chains to localStorage:", error);
    }
  }, [passChains]);

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
        <PassChainsListView
          passChains={passChains}
          onClearAllPassChains={handleClearAllPassChains}
          onImportPassChains={handleImportPassChains}
          onRemovePassChain={handleRemovePassChain}
        />
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
