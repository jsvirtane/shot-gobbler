import { ChainAction, PassChain } from "../../types/PassChain";
import PitchContainer from "../PitchContainer/PitchContainer";
import PassChainVisualization from "./PassChainVisualization";

type PassChainMapProps = {
  onPitchClick: (x: number, y: number) => void;
  passChains: PassChain[];
  currentPassChain?: ChainAction[];
};

export const PassChainMap: React.FC<PassChainMapProps> = ({
  onPitchClick,
  passChains,
  currentPassChain,
}) => {
  const hasActiveCurrentChain = currentPassChain && currentPassChain.length > 0;

  return (
    <PitchContainer onCoordinateClick={onPitchClick}>
      {/* Render completed pass chains */}
      {passChains.map((chain) => (
        <PassChainVisualization
          key={chain.id}
          chain={chain}
          isCurrentChain={!hasActiveCurrentChain}
        />
      ))}

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
