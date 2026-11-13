import React, { useState } from "react";
import { ClearButton } from "../components/common";
import Modal from "../components/Modal/Modal";
import PassChainForm from "../components/PassChainForm/PassChainForm";
import PassChainsListView from "../components/PassChainsListView/PassChainsListView";
import PassChainsPitchView from "../components/PassChainsPitchView/PassChainsPitchView";
import PassChainStatsPanel from "../components/Stats/PassChainStatsPanel";
import { ChainsSummaryBar } from "../components/Stats/SummaryBar";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useUndoableList } from "../hooks/useUndoableList";
import { useUrlState } from "../hooks/useUrlState";
import { DEFAULT_MATCH_ID, EventStamp } from "../types/Match";
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

const PASS_CHAINS_VIEWS = ["pitch", "list", "stats"] as const;
type PassChainsView = (typeof PASS_CHAINS_VIEWS)[number];

const viewOptions = [
  { id: "pitch", label: "Pitch View", icon: "⚽️" },
  { id: "list", label: "List View", icon: "📋" },
  { id: "stats", label: "Stats", icon: "📊" },
];

interface PassChainsViewProps {
  passChains: PassChain[];
  setPassChains: React.Dispatch<React.SetStateAction<PassChain[]>>;
  /** Match fields stamped on each new chain. */
  getEventStamp?: () => EventStamp;
}

const defaultEventStamp = (): EventStamp => ({ matchId: DEFAULT_MATCH_ID });

const PassChainsView: React.FC<PassChainsViewProps> = ({
  passChains,
  setPassChains,
  getEventStamp = defaultEventStamp,
}) => {
  const [currentView, setCurrentView] = useUrlState<PassChainsView>(
    "view",
    "pitch",
    PASS_CHAINS_VIEWS,
  );
  const [selectedActionType, setSelectedActionType] =
    useState<ChainActionType>("start");

  const chainList = useUndoableList(passChains, setPassChains, {
    one: "Pass chain",
    many: "pass chains",
  });

  const [currentPassChain, setCurrentPassChain] = useState<ChainAction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Saved chain highlighted by tapping one of its markers
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  // Match minute and period taken when the chain's first action is tapped
  const [chainStamp, setChainStamp] = useState<EventStamp | null>(null);
  const isActivePassChain = currentPassChain.length > 0;

  const handlePitchClick = (x: number, y: number) => {
    console.log(`Pitch clicked at: x=${x}, y=${y}`);
    if (currentPassChain.length === 0) setChainStamp(getEventStamp());

    // While a chain is selected, a tap elsewhere only clears the selection
    if (selectedChainId && passChains.some((c) => c.id === selectedChainId)) {
      setSelectedChainId(null);
      return;
    }

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
        ...(chainStamp ?? getEventStamp()),
        id: `chain-${Date.now()}`,
        actions: currentPassChain,
        terminationReason: data.terminationReason,
        isCompleted: true,
        zones: getZonesFromPassChain(currentPassChain),
      };

      chainList.add(newChain);
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

  const handleClearAllPassChains = chainList.clearAll;
  const handleRemovePassChain = chainList.remove;

  const handleDeleteSelectedChain = () => {
    if (selectedChainId) chainList.remove(selectedChainId);
    setSelectedChainId(null);
  };

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
          selectedChainId={selectedChainId}
          onChainClick={setSelectedChainId}
          onDeleteSelectedChain={handleDeleteSelectedChain}
          onCloseSelection={() => setSelectedChainId(null)}
        />
      ) : currentView === "stats" ? (
        <>
          <ChainsSummaryBar passChains={passChains} />
          <PassChainStatsPanel passChains={passChains} />
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <ChainsSummaryBar passChains={passChains} />
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

      <Modal
        isOpen={isModalOpen}
        title="Complete Pass Chain"
        maxWidth="500px"
        onClose={() => setIsModalOpen(false)}
      >
        <PassChainForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default PassChainsView;
