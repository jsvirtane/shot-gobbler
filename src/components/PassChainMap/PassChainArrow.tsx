import React from "react";
import { ChainAction } from "../../types/PassChain";
import { ArrowStyle, SvgArrow } from "../common/SvgArrow";

type PassChainArrowProps = {
  fromAction: ChainAction;
  toAction: ChainAction;
  isCurrentChain?: boolean;
};

const getArrowStyle = (
  actionType: string,
  isCurrentChain: boolean,
): ArrowStyle => {
  const baseColor = isCurrentChain ? "#ffffff" : "#6b7280";
  const baseOpacity = isCurrentChain ? "0.9" : "0.4";

  const base: ArrowStyle = {
    strokeColor: baseColor,
    strokeWidth: isCurrentChain ? "2" : "1.5",
    opacity: baseOpacity,
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
  const arrowStyle = getArrowStyle(toAction.actionType, isCurrentChain);
  const path = toAction.actionType === "cross" ? "curved" : "straight";

  // Determine curve direction based on field position for crosses
  const curveDirection = fromAction.x < 50 ? -1 : 1;

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
      <SvgArrow
        startX={fromAction.x}
        startY={fromAction.y}
        endX={toAction.x}
        endY={toAction.y}
        path={path}
        style={arrowStyle}
        curveDirection={curveDirection}
      />
    </svg>
  );
};

export default PassChainArrow;
