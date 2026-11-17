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
/**
 * "tiles": separate buttons with gaps; "joined": one pill split into
 * segments; "pill": a grey track with the choice as a white pill (view
 * switches); "chips": small rounded chips (filters).
 */
type Variant = "tiles" | "joined" | "pill" | "chips";

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

const PILL_OPTION = "flex-1 rounded-md px-3 py-1.5 text-sm font-medium";
const PILL_ACTIVE = "bg-white text-gray-900 shadow-sm";
const PILL_INACTIVE = "text-gray-600 hover:text-gray-900";

const CHIP_OPTION =
  "min-w-0 shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap";
const CHIP_ACTIVE = "border-blue-300 bg-blue-50 text-blue-700";
const CHIP_INACTIVE = "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";

const VARIANT_COLOURS: Record<Variant, { active: string; inactive: string }> = {
  tiles: {
    active: ShotFormColors.active,
    inactive: ShotFormColors.inactive,
  },
  joined: { active: JOINED_ACTIVE, inactive: JOINED_INACTIVE },
  pill: { active: PILL_ACTIVE, inactive: PILL_INACTIVE },
  chips: { active: CHIP_ACTIVE, inactive: CHIP_INACTIVE },
};

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
    : variant === "pill"
      ? "flex gap-0.5 rounded-lg bg-gray-100 p-0.5"
      : variant === "chips"
        ? "flex min-w-0 gap-1.5"
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
            VARIANT_COLOURS[variant].active)
          : (inactiveClassName ?? VARIANT_COLOURS[variant].inactive);
        const shape = joined
          ? `${JOINED_SIZE[size]} ${index === 0 ? "rounded-l-lg" : ""} ${index === options.length - 1 ? "rounded-r-lg" : ""}`
          : variant === "pill"
            ? PILL_OPTION
            : variant === "chips"
              ? CHIP_OPTION
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
