import React from "react";
import { ChainAction, PassChain } from "../../types/PassChain";
import PassChainActionMarker from "./PassChainActionMarker";
import PassChainArrow from "./PassChainArrow";

type PassChainVisualizationProps = {
  chain?: PassChain;
  actions?: ChainAction[];
  isCurrentChain?: boolean;
};

export const PassChainVisualization: React.FC<PassChainVisualizationProps> = ({
  chain,
  actions,
  isCurrentChain = false,
}) => {
  const actionsToRender = chain?.actions || actions || [];

  if (actionsToRender.length === 0) {
    return null;
  }

  return (
    <>
      {/* Render arrows between consecutive actions */}
      {actionsToRender.map((action, index) => {
        if (index === actionsToRender.length - 1) return null; // No arrow after last action

        const nextAction = actionsToRender[index + 1];
        return (
          <PassChainArrow
            key={`${chain?.id || "current"}-arrow-${index}`}
            fromAction={action}
            toAction={nextAction}
            isCurrentChain={isCurrentChain}
          />
        );
      })}

      {/* Render action markers */}
      {actionsToRender.map((action, index) => (
        <PassChainActionMarker
          key={`${chain?.id || "current"}-action-${index}`}
          action={action}
          isCurrentChain={isCurrentChain}
        />
      ))}
    </>
  );
};

export default PassChainVisualization;
