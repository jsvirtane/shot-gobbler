import React from "react";

export type ArrowPath = "straight" | "curved";

export type ArrowStyle = {
  strokeColor: string;
  strokeWidth: string;
  opacity: string;
  strokeDasharray?: string;
  strokeDashoffset?: string;
};

export type SvgArrowProps = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  path?: ArrowPath;
  style: ArrowStyle;
  curveDirection?: 1 | -1; // -1 or 1 for curve direction
  curveIntensity?: number; // 0-1 for how curved
};

export const SvgArrow: React.FC<SvgArrowProps> = ({
  startX,
  startY,
  endX,
  endY,
  path = "straight",
  style,
  curveDirection = 1,
  curveIntensity = 0.3,
}) => {
  const renderPath = () => {
    if (path === "curved") {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Calculate perpendicular offset for curve
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const curveOffset = Math.min(length * curveIntensity, 15);

      const offsetX = (-dy / length) * curveOffset * curveDirection;
      const offsetY = (dx / length) * curveOffset * curveDirection;

      const pathData = `M ${startX} ${startY} Q ${midX + offsetX} ${midY + offsetY} ${endX} ${endY}`;

      return (
        <path
          d={pathData}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          fill="none"
          opacity={style.opacity}
          strokeDasharray={style.strokeDasharray}
          strokeDashoffset={style.strokeDashoffset}
          vectorEffect="non-scaling-stroke"
        />
      );
    }

    // Straight line
    return (
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={style.strokeColor}
        strokeWidth={style.strokeWidth}
        opacity={style.opacity}
        strokeDasharray={style.strokeDasharray}
        strokeDashoffset={style.strokeDashoffset}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return <g>{renderPath()}</g>;
};

export default SvgArrow;
