import React from "react";
import { ChainAction, PassChain } from "../../types/PassChain";
import PassChainActionMarker from "./PassChainActionMarker";
import PassChainArrow from "./PassChainArrow";
import PassChainTerminationMarker from "./PassChainTerminationMarker";

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

  // For current chains (being recorded), the last action should be a placeholder
  // For completed chains, we need to render the termination marker
  const isCompletedChain = !!chain?.isCompleted;

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

      {/* Render action markers with correct positioning logic */}
      {actionsToRender.map((action, index) => {
        // First action: always shows as placeholder since we don't know what action will start from here
        if (index === 0) {
          const startMarker: ChainAction = {
            ...action,
            actionType: "placeholder",
          };
          return (
            <PassChainActionMarker
              key={`${chain?.id || "current"}-start-${index}`}
              action={startMarker}
              isCurrentChain={isCurrentChain}
            />
          );
        }

        // For subsequent actions: show the action type at the position where it STARTS
        // This means action[i] marker appears at position[i-1] with action[i]'s type
        const previousAction = actionsToRender[index - 1];
        const actionMarker: ChainAction = {
          ...previousAction, // Use previous position (where this action starts)
          actionType: action.actionType, // But use current action's type
          sequenceNumber: action.sequenceNumber, // And current sequence number
        };

        return (
          <PassChainActionMarker
            key={`${chain?.id || "current"}-action-${index}`}
            action={actionMarker}
            isCurrentChain={isCurrentChain}
          />
        );
      })}

      {/* For current chains: show placeholder at the last position */}
      {isCurrentChain && !isCompletedChain && actionsToRender.length > 0 && (
        <PassChainActionMarker
          key={`${chain?.id || "current"}-current-placeholder`}
          action={{
            ...actionsToRender[actionsToRender.length - 1],
            actionType: "placeholder",
          }}
          isCurrentChain={isCurrentChain}
        />
      )}

      {/* Render termination marker for completed chains */}
      {isCompletedChain && chain && actionsToRender.length > 0 && (
        <PassChainTerminationMarker
          key={`${chain.id}-termination`}
          action={actionsToRender[actionsToRender.length - 1]}
          terminationReason={chain.terminationReason}
          isCurrentChain={isCurrentChain}
        />
      )}
    </>
  );
};

export default PassChainVisualization;
