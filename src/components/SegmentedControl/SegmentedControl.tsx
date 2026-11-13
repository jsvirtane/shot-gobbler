import React, { useRef } from "react";
import { ShotFormColors } from "../../constants/shotFormColors";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Emoji shown before the label. */
  icon?: string;
  /** Overrides the group's active classes for this option (e.g. red for a failed outcome). */
  activeClassName?: string;
}

/** sm: compact text-sm; md: text-base; lg: text-sm with a tall (44px) tap target. */
type Size = "sm" | "md" | "lg";
/** "tiles": separate buttons with gaps; "joined": one pill split into segments. */
type Variant = "tiles" | "joined";

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group. */
  ariaLabel: string;
  /** Lays tiles out in a grid; without it they share one row equally. */
  columns?: 1 | 2 | 3 | 4;
  size?: Size;
  variant?: Variant;
  activeClassName?: string;
  inactiveClassName?: string;
  /** Extra classes for every option button (e.g. padding tweaks). */
  optionClassName?: string;
  className?: string;
}

// Static class names so Tailwind picks them up
const GRID_COLUMNS = {
  1: "grid grid-cols-1",
  2: "grid grid-cols-2",
  3: "grid grid-cols-3",
  4: "grid grid-cols-4",
} as const;

const TILE_SIZE: Record<Size, string> = {
  sm: "rounded px-4 py-2 text-sm",
  md: "rounded-md px-4 py-2.5 text-base",
  lg: "rounded-md px-3 py-3 text-sm font-medium",
};

const JOINED_SIZE: Record<Size, string> = {
  sm: "px-4 py-2 text-sm font-medium",
  md: "px-4 py-2.5 text-base font-medium",
  lg: "px-4 py-3 text-sm font-medium",
};

const JOINED_ACTIVE = "bg-blue-600 text-white";
const JOINED_INACTIVE =
  "border border-gray-200 bg-white text-gray-900 hover:bg-gray-100";

const FOCUS_RING =
  "focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

/**
 * A single-choice group of buttons with radio group semantics: arrow keys
 * move and select, and only the selected option is in the Tab order.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  columns,
  size = "md",
  variant = "tiles",
  activeClassName,
  inactiveClassName,
  optionClassName = "",
  className = "",
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  // Keep the group reachable by Tab even when nothing is selected
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;
  const joined = variant === "joined";

  const select = (index: number) => {
    const option = options[index];
    buttonRefs.current[index]?.focus();
    if (option.value !== value) onChange(option.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = options.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(next);
  };

  const layout = joined
    ? "inline-flex rounded-md shadow-sm"
    : `${columns ? GRID_COLUMNS[columns] : "flex"} gap-2`;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`${layout} ${className}`}
    >
      {options.map((option, index) => {
        const isActive = index === selectedIndex;
        const colours = isActive
          ? (option.activeClassName ??
            activeClassName ??
            (joined ? JOINED_ACTIVE : ShotFormColors.active))
          : (inactiveClassName ??
            (joined ? JOINED_INACTIVE : ShotFormColors.inactive));
        const shape = joined
          ? `${JOINED_SIZE[size]} ${index === 0 ? "rounded-l-lg" : ""} ${index === options.length - 1 ? "rounded-r-lg" : ""}`
          : `${TILE_SIZE[size]} ${columns ? "" : "flex-1"}`;

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex items-center justify-center gap-2 transition-colors ${shape} ${colours} ${optionClassName} ${FOCUS_RING}`}
          >
            {/* One text node keeps the visible text and accessible name together */}
            {option.icon ? `${option.icon} ${option.label}` : option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
