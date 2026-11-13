import React from "react";
import { MARKER_HALO_COLOR } from "../../constants/markerColors";
import { markerBoxSize, MarkerShapeName } from "../../utils/markerStyle";

/** Width of the white outline in px. */
const HALO = 1.5;

const starPoints = (centre: number, outer: number) => {
  const inner = outer * 0.48;
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    // Nudge down a little: a star's visual centre is below its box centre
    const x = centre + r * Math.cos(angle);
    const y = centre + outer * 0.06 + r * Math.sin(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
};

const trianglePoints = (box: number) => {
  const pad = HALO;
  const side = box - pad * 2;
  const height = (side * Math.sqrt(3)) / 2;
  const top = (box - height) / 2;
  return [
    `${box / 2},${top}`,
    `${box - pad},${top + height}`,
    `${pad},${top + height}`,
  ].join(" ");
};

interface MarkerShapeProps {
  shape: MarkerShapeName;
  color: string;
  /** Visible size in px; stars and triangles are drawn a bit larger. */
  size: number;
  /** Drop the white outline, e.g. in a legend on a light background. */
  halo?: boolean;
  className?: string;
}

/**
 * A marker glyph as inline SVG with presentation attributes only, so that
 * html2canvas draws it the same as the browser in shared images.
 */
export const MarkerShape: React.FC<MarkerShapeProps> = ({
  shape,
  color,
  size,
  halo = true,
  className,
}) => {
  const box = markerBoxSize(shape, size);
  const c = box / 2;
  const haloWidth = halo ? HALO : 0;
  const filled = {
    fill: color,
    fillOpacity: 0.92,
    stroke: MARKER_HALO_COLOR,
    strokeWidth: haloWidth,
    strokeLinejoin: "round" as const,
  };

  let body: React.ReactNode;
  switch (shape) {
    case "star":
      body = <polygon points={starPoints(c, c - HALO)} {...filled} />;
      break;
    case "triangle":
      body = <polygon points={trianglePoints(box)} {...filled} />;
      break;
    case "ring": {
      // Coloured ring with a white outer edge; the pitch shows through
      const ring = Math.max(2, size * 0.17);
      const r = c - ring / 2 - haloWidth;
      body = (
        <>
          {halo && (
            <circle
              cx={c}
              cy={c}
              r={c - HALO / 2}
              fill="none"
              stroke={MARKER_HALO_COLOR}
              strokeWidth={HALO}
            />
          )}
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={ring}
          />
        </>
      );
      break;
    }
    case "circle":
    default:
      body = <circle cx={c} cy={c} r={c - HALO / 2} {...filled} />;
  }

  return (
    <svg
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      className={className}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
      focusable="false"
      data-shape={shape}
      data-color={color}
      data-size={size}
    >
      {body}
    </svg>
  );
};

export default MarkerShape;
