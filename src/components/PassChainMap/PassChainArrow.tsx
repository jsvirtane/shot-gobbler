import React from "react";
import { ChainAction } from "../../types/PassChain";

type PassChainArrowProps = {
  fromAction: ChainAction;
  toAction: ChainAction;
  isCurrentChain?: boolean;
};

const getArrowStyling = (actionType: string, isCurrentChain: boolean) => {
  const baseColor = isCurrentChain ? "#ffffff" : "#6b7280";
  const baseOpacity = isCurrentChain ? "0.9" : "0.4";

  const base = {
    strokeColor: baseColor,
    strokeWidth: isCurrentChain ? "2" : "1.5",
    opacity: baseOpacity,
    strokeDasharray: "none",
    strokeDashoffset: "0",
  };

  switch (actionType) {
    case "carry":
      return {
        ...base,
        strokeDasharray: "4,4",
      };
    case "shot":
      return {
        ...base,
        strokeColor: "#ef4444",
      };
    case "pass":
    case "cross":
    default:
      return base;
  }
};

export const PassChainArrow: React.FC<PassChainArrowProps> = ({
  fromAction,
  toAction,
  isCurrentChain = false,
}) => {
  const startX = fromAction.x;
  const startY = fromAction.y;

  const {
    strokeColor,
    strokeWidth,
    opacity,
    strokeDasharray,
    strokeDashoffset,
  } = getArrowStyling(toAction.actionType, isCurrentChain);

  const renderArrowPath = () => {
    let markerId = isCurrentChain ? "arrowhead-current" : "arrowhead-past";

    // Use red arrowhead for shots
    if (toAction.actionType === "shot") {
      markerId = "arrowhead-shot";
    }

    // For cross actions, create a curved path
    if (toAction.actionType === "cross") {
      const midX = (startX + toAction.x) / 2;
      const midY = (startY + toAction.y) / 2;
      // Add curve offset (perpendicular to the line)
      const dx = toAction.x - startX;
      const dy = toAction.y - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const curveOffset = Math.min(length * 0.3, 15); // Limit curve to reasonable amount

      // Determine curve direction based on field side
      const curveDirection = midX < 50 ? -1 : 1;
      const offsetX = (-dy / length) * curveOffset * curveDirection;
      const offsetY = (dx / length) * curveOffset * curveDirection;

      const pathData = `M ${startX} ${startY} Q ${midX + offsetX} ${midY + offsetY} ${toAction.x} ${toAction.y}`;

      return (
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          markerEnd={`url(#${markerId})`}
          opacity={opacity}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          vectorEffect="non-scaling-stroke"
        />
      );
    } else {
      // Regular straight line for pass, carry, and shot
      return (
        <line
          x1={startX}
          y1={startY}
          x2={toAction.x}
          y2={toAction.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd={`url(#${markerId})`}
          opacity={opacity}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          vectorEffect="non-scaling-stroke"
        />
      );
    }
  };

  return (
    <svg
      className="pointer-events-none absolute z-5"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        left: "0%",
        top: "0%",
        width: "100%",
        height: "100%",
      }}
    >
      <defs>
        <marker
          id="arrowhead-current"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
        </marker>
        <marker
          id="arrowhead-past"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
        <marker
          id="arrowhead-shot"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>
      {renderArrowPath()}
    </svg>
  );
};

export default PassChainArrow;
