import React from "react";

/**
 * Small line and shape icons for the radial menu, drawn in a 24 px box with
 * currentColor so they take the segment's text colour. The result shapes
 * match the pitch markers (star, disc, triangle, ring).
 */
export type RadialIconName =
  | "star"
  | "disc"
  | "triangle"
  | "ring"
  | "check"
  | "plus"
  | "move"
  | "trash"
  | "back"
  | "more"
  | "flag"
  | "swap";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<RadialIconName, React.ReactNode> = {
  star: (
    <polygon
      fill="currentColor"
      points="12,2.5 14.8,8.6 21.5,9.3 16.5,13.8 17.9,20.4 12,17 6.1,20.4 7.5,13.8 2.5,9.3 9.2,8.6"
    />
  ),
  disc: <circle cx="12" cy="12" r="8" fill="currentColor" />,
  triangle: <polygon fill="currentColor" points="12,3.5 21,19.5 3,19.5" />,
  ring: <circle cx="12" cy="12" r="7.5" {...stroke} strokeWidth={2.8} />,
  check: (
    <polyline points="4.5,12.5 9.5,17.5 19.5,6.5" {...stroke} strokeWidth={3} />
  ),
  plus: <path d="M12 5v14M5 12h14" {...stroke} strokeWidth={3} />,
  move: (
    <path
      d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"
      {...stroke}
    />
  ),
  trash: (
    <path
      d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"
      {...stroke}
    />
  ),
  back: <path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={3} />,
  more: (
    <g fill="currentColor">
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
    </g>
  ),
  flag: <path d="M6 21V4M6 4h11l-2.5 4.5L17 13H6" {...stroke} />,
  swap: <path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" {...stroke} />,
};

interface RadialIconProps {
  name: RadialIconName;
  /** Top-left corner and size, for use inside an SVG. */
  x?: number;
  y?: number;
  size?: number;
  className?: string;
}

/** Icon as a nested <svg>, usable inside the ring's SVG or on its own. */
export const RadialIcon: React.FC<RadialIconProps> = ({
  name,
  x,
  y,
  size = 16,
  className,
}) => (
  <svg
    x={x}
    y={y}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className={className}
    data-icon={name}
  >
    {ICONS[name]}
  </svg>
);
