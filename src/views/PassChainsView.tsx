import React, { useRef, useState } from "react";
import { ClearButton } from "../components/common";
import { useTrackerControls } from "../components/FocusMode/trackerControls";
import { ChainStepType } from "../components/PassChainMap/chainRadial";
import PassChainsListView from "../components/PassChainsListView/PassChainsListView";
import PassChainsPitchView from "../components/PassChainsPitchView/PassChainsPitchView";
import PassChainStatsPanel from "../components/Stats/PassChainStatsPanel";
import { ChainsSummaryBar } from "../components/Stats/SummaryBar";
import { useToast } from "../components/Toast";
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
  /** Focus mode: only the pitch, filling the screen. */
  focus?: boolean;
}

const defaultEventStamp = (): EventStamp => ({ matchId: DEFAULT_MATCH_ID });

const makeAction = (
  x: number,
  y: number,
  sequenceNumber: number,
  actionType: ChainActionType,
): ChainAction => ({
  x,
  y,
  sequenceNumber,
  actionType,
  pitchZone: getZoneFromCoordinates({ x, y }),
});

const stampOf = (chain: PassChain): EventStamp => ({
  matchId: chain.matchId ?? DEFAULT_MATCH_ID,
  ...(chain.minute !== undefined && { minute: chain.minute }),
  ...(chain.period !== undefined && { period: chain.period }),
});

/**
 * Pass chains are recorded on the pitch: the first tap starts a chain, each
 * next tap opens the Step ring (how the ball got there), and End chain opens
 * the End ring, whose pick saves the chain.
 */
const PassChainsView: React.FC<PassChainsViewProps> = ({
  passChains,
  setPassChains,
  getEventStamp = defaultEventStamp,
  focus = false,
}) => {
  const [currentView, setCurrentView] = useUrlState<PassChainsView>(
    "view",
    "pitch",
    PASS_CHAINS_VIEWS,
  );

  const chainList = useUndoableList(passChains, setPassChains, {
    one: "Pass chain",
    many: "pass chains",
  });
  const { showToast } = useToast();

  const [currentPassChain, setCurrentPassChain] = useState<ChainAction[]>([]);
  // Step outlined in the Step ring: the one used last
  const [lastStep, setLastStep] = useState<ChainStepType>("pass");
  // Saved chain highlighted by tapping one of its markers
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  // Match minute and period taken when the chain's first point is tapped
  const [chainStamp, setChainStamp] = useState<EventStamp | null>(null);
  // The chain saved last, which undo reopens while nothing changed since
  const reopenable = useRef<PassChain | null>(null);
  const isActivePassChain = currentPassChain.length > 0;

  const handleStartChain = (x: number, y: number) => {
    setSelectedChainId(null);
    setChainStamp(getEventStamp());
    setCurrentPassChain([makeAction(x, y, 0, "start")]);
    showToast({
      message: "Chain started · tap where the ball goes",
      duration: 2500,
    });
  };

  const handleAddStep = (x: number, y: number, step: ChainStepType) => {
    setLastStep(step);
    setCurrentPassChain((prev) => [
      ...prev,
      makeAction(x, y, prev.length, step),
    ]);
    // No toast per step: the new point shows on the pitch, and a toast at
    // the top would cover the far goal where the next tap often goes
  };

  const handleEndChain = (terminationReason: ChainTerminationReason) => {
    if (currentPassChain.length === 0) return;
    const newChain: PassChain = {
      ...(chainStamp ?? getEventStamp()),
      id: `chain-${Date.now()}`,
      actions: currentPassChain,
      terminationReason,
      isCompleted: true,
      zones: getZonesFromPassChain(currentPassChain),
    };
    chainList.add(newChain);
    reopenable.current = newChain;
    setCurrentPassChain([]);
    setChainStamp(null);
  };

  const handleUndoLastAction = () => {
    setCurrentPassChain((prevChain) => prevChain.slice(0, -1));
  };

  // The bar's undo takes back the in-progress chain's last point first, then
  // reopens the chain saved last so it can be continued or ended again
  useTrackerControls({
    undo: () => {
      if (currentPassChain.length > 0) {
        handleUndoLastAction();
        return;
      }
      const saved = reopenable.current;
      reopenable.current = null;
      if (saved && passChains.some((c) => c.id === saved.id)) {
        // Saving was the newest change, so this takes the chain out again
        chainList.undoLast();
        setChainStamp(stampOf(saved));
        setCurrentPassChain(saved.actions);
        return;
      }
      chainList.undoLast();
    },
    canUndo: isActivePassChain || chainList.canUndo,
  });

  const handleRemovePassChain = (id: string) => {
    reopenable.current = null;
    chainList.remove(id);
  };

  const handleClearAllPassChains = () => {
    reopenable.current = null;
    chainList.clearAll();
  };

  const handleDeleteChain = (id: string) => {
    handleRemovePassChain(id);
    setSelectedChainId(null);
  };

  return (
    <>
      {!focus && (
        <ViewToggle
          currentView={currentView}
          options={viewOptions}
          onViewChange={(view) => setCurrentView(view as PassChainsView)}
          className="mb-4"
        />
      )}

      {focus || currentView === "pitch" ? (
        <PassChainsPitchView
          focus={focus}
          passChains={passChains}
          currentPassChain={currentPassChain}
          lastStep={lastStep}
          onStartChain={handleStartChain}
          onAddStep={handleAddStep}
          onEndChain={handleEndChain}
          selectedChainId={selectedChainId}
          onSelectChain={setSelectedChainId}
          onDeleteChain={handleDeleteChain}
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
    </>
  );
};

export default PassChainsView;
