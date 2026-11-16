import React, { useRef, useState } from "react";
import {
  ChainAction,
  ChainTerminationReason,
  PassChain,
} from "../../types/PassChain";
import {
  ChainEndItem,
  ChainStepItem,
  ChainStepType,
  CLOSE_CHAIN_ID,
  DELETE_CHAIN_ID,
  END_CHAIN_ID,
  endSections,
  savedChainSections,
  stepSections,
} from "../PassChainMap/chainRadial";
import { PassChainMap } from "../PassChainMap/PassChainMap";
import RadialMenu, { Point, RadialItem } from "../RadialMenu";

type PassChainsPitchViewProps = {
  passChains: PassChain[];
  currentPassChain: ChainAction[];
  /** Step outlined in the Step ring. */
  lastStep: ChainStepType | null;
  /** First tap: starts a chain at the point. */
  onStartChain: (x: number, y: number) => void;
  /** A step picked in the Step ring adds the tapped point. */
  onAddStep: (x: number, y: number, step: ChainStepType) => void;
  /** An option picked in the End ring saves the chain. */
  onEndChain: (reason: ChainTerminationReason) => void;
  /** Saved chain selected by tapping one of its markers. */
  selectedChainId?: string | null;
  onSelectChain?: (id: string | null) => void;
  onDeleteChain?: (id: string) => void;
  /** Focus mode: the pitch fills the parent. */
  focus?: boolean;
};

/** The open ring, with the tap point in pitch % for a step. */
type Ring =
  | { kind: "step"; x: number; y: number; anchor: Point }
  | { kind: "end"; anchor: Point }
  | { kind: "chain"; id: string; anchor: Point };

const centerContent = (title: string, subtitle: string) => (
  <>
    <span className="font-semibold">{title}</span>
    <span className="text-[10px] text-gray-500">{subtitle}</span>
  </>
);

const PassChainsPitchView: React.FC<PassChainsPitchViewProps> = ({
  passChains,
  currentPassChain,
  lastStep,
  onStartChain,
  onAddStep,
  onEndChain,
  selectedChainId,
  onSelectChain,
  onDeleteChain,
  focus = false,
}) => {
  const isActivePassChain = currentPassChain.length > 0;
  const [ring, setRing] = useState<Ring | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  /** Pitch % (full pitch) to px in the ring's container. */
  const toAnchor = (x: number, y: number): Point => {
    const area = areaRef.current;
    const pitch = area?.querySelector<HTMLElement>("[data-testid=pitch]");
    if (!area || !pitch) return { x: 0, y: 0 };
    const a = area.getBoundingClientRect();
    const p = pitch.getBoundingClientRect();
    return {
      x: p.left - a.left + (x / 100) * p.width,
      y: p.top - a.top + (y / 100) * p.height,
    };
  };

  const handlePitchClick = (x: number, y: number) => {
    if (ring) return;
    if (!isActivePassChain) {
      // A tap elsewhere only clears a selection
      if (selectedChainId && passChains.some((c) => c.id === selectedChainId))
        onSelectChain?.(null);
      else onStartChain(x, y);
      return;
    }
    setRing({ kind: "step", x, y, anchor: toAnchor(x, y) });
  };

  // Where the latest press was, so a chain's ring opens at the tapped marker
  const lastPress = useRef<Point | null>(null);
  const handlePressCapture = (event: React.PointerEvent) => {
    const area = areaRef.current;
    if (!area) return;
    const a = area.getBoundingClientRect();
    lastPress.current = { x: event.clientX - a.left, y: event.clientY - a.top };
  };

  const handleChainClick = (id: string) => {
    const chain = passChains.find((c) => c.id === id);
    if (!chain) return;
    const last = chain.actions[chain.actions.length - 1];
    const pressed = lastPress.current;
    lastPress.current = null;
    onSelectChain?.(id);
    setRing({
      kind: "chain",
      id,
      // A keyboard press has no point: open at the chain's end
      anchor: pressed ?? (last ? toAnchor(last.x, last.y) : { x: 0, y: 0 }),
    });
  };

  const closeRing = () => {
    if (ring?.kind === "chain") onSelectChain?.(null);
    setRing(null);
  };

  const handlePick = (item: RadialItem) => {
    if (!ring) return;
    if (ring.kind === "step") {
      if (item.id === END_CHAIN_ID) {
        setRing({ kind: "end", anchor: ring.anchor });
        return;
      }
      onAddStep(ring.x, ring.y, (item as ChainStepItem).step);
    } else if (ring.kind === "end") {
      onEndChain((item as ChainEndItem).reason);
    } else {
      if (item.id === DELETE_CHAIN_ID) onDeleteChain?.(ring.id);
      else if (item.id === CLOSE_CHAIN_ID) onSelectChain?.(null);
    }
    setRing(null);
  };

  const selectedIndex = passChains.findIndex((c) => c.id === selectedChainId);
  const ringChain =
    ring?.kind === "chain" ? passChains.find((c) => c.id === ring.id) : null;

  const renderRing = () => {
    if (!ring) return null;
    if (ring.kind === "step") {
      return (
        <RadialMenu
          anchor={ring.anchor}
          sections={stepSections(lastStep)}
          ariaLabel="Chain step"
          center={{
            content: centerContent(
              `Step ${currentPassChain.length}`,
              "how did it get here?",
            ),
            ariaLabel: `Step ${currentPassChain.length}`,
          }}
          onPick={handlePick}
          onClose={closeRing}
        />
      );
    }
    if (ring.kind === "end") {
      return (
        <RadialMenu
          anchor={ring.anchor}
          sections={endSections()}
          ariaLabel="End chain"
          center={{
            content: centerContent("End", "how did it end?"),
            ariaLabel: "End chain",
          }}
          onPick={handlePick}
          onClose={closeRing}
        />
      );
    }
    if (!ringChain) return null;
    const points = ringChain.actions.length;
    return (
      <RadialMenu
        anchor={ring.anchor}
        sections={savedChainSections()}
        ariaLabel="Pass chain"
        center={{
          content: centerContent(
            `Chain ${selectedIndex + 1}`,
            `${points} ${points === 1 ? "point" : "points"}`,
          ),
          ariaLabel: `Chain ${selectedIndex + 1}, ${points} ${points === 1 ? "point" : "points"}`,
        }}
        onPick={handlePick}
        onClose={closeRing}
      />
    );
  };

  return (
    // The ring is drawn over this area: the pitch (and legend)
    <div
      ref={areaRef}
      className={focus ? "relative flex min-h-0 flex-1 flex-col" : "relative"}
      data-testid="chain-pitch-area"
      onPointerDownCapture={handlePressCapture}
    >
      <PassChainMap
        focus={focus}
        onPitchClick={handlePitchClick}
        passChains={passChains}
        currentPassChain={currentPassChain}
        selectedChainId={
          selectedIndex === -1 ? null : passChains[selectedIndex].id
        }
        onChainClick={handleChainClick}
        hint={
          !isActivePassChain &&
          passChains.length === 0 && (
            <>
              <strong>Click on the pitch to start a new pass chain.</strong>
              <br />
              Then tap each place the ball goes, and pick how it got there.
            </>
          )
        }
      />
      {renderRing()}
    </div>
  );
};

export default PassChainsPitchView;
