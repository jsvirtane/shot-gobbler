import { ChainAction, PassChain } from "../../types/PassChain";
import PitchContainer from "../PitchContainer/PitchContainer";
import PassChainVisualization from "./PassChainVisualization";

type PassChainMapProps = {
  onPitchClick: (x: number, y: number) => void;
  passChains: PassChain[];
  currentPassChain?: ChainAction[];
  /** Highlighted saved chain; the others are dimmed. */
  selectedChainId?: string | null;
  /** Tap on a saved chain's marker (only while no chain is being recorded). */
  onChainClick?: (id: string) => void;
};

export const PassChainMap: React.FC<PassChainMapProps> = ({
  onPitchClick,
  passChains,
  currentPassChain,
  selectedChainId,
  onChainClick,
}) => {
  const hasActiveCurrentChain = currentPassChain && currentPassChain.length > 0;
  const hasSelection =
    !!selectedChainId && passChains.some((c) => c.id === selectedChainId);

  return (
    <PitchContainer onCoordinateClick={onPitchClick} reservedHeight="22.25rem">
      {/* Render completed pass chains */}
      {passChains.map((chain) => {
        const isSelected = hasSelection && chain.id === selectedChainId;
        const isDimmed = hasSelection && !isSelected;
        return (
          // Same box as the pitch, so markers keep their % positions
          <div
            key={chain.id}
            className={`pointer-events-none absolute inset-0 ${isSelected ? "z-10" : ""}`}
            style={isDimmed ? { opacity: 0.25 } : undefined}
            data-testid="chain-layer"
            data-selected={isSelected || undefined}
          >
            <PassChainVisualization
              chain={chain}
              isCurrentChain={!hasActiveCurrentChain}
              onMarkerTap={
                !hasActiveCurrentChain && onChainClick
                  ? () => onChainClick(chain.id)
                  : undefined
              }
            />
          </div>
        );
      })}

      {/* Render current pass chain being recorded */}
      {hasActiveCurrentChain && (
        <PassChainVisualization
          actions={currentPassChain}
          isCurrentChain={true}
        />
      )}
    </PitchContainer>
  );
};
