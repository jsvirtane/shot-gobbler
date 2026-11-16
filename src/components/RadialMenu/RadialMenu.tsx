import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { RadialIcon, RadialIconName } from "./RadialIcons";
import {
  Insets,
  LABEL_HEIGHT,
  labelWidth,
  layoutRadial,
  NO_INSETS,
  Point,
  polar,
  RING_RIM,
  sectionLabelPosition,
  sectorPath,
  Size,
} from "./radialGeometry";

/**
 * - action: picks a value (e.g. a result); solid colour, white label.
 * - toggle: switches a setting; white with "+" when off, blue with ✓ when on.
 * - nav: opens another ring or mode (e.g. Move).
 * - danger: destructive (e.g. Delete).
 */
export type RadialItemKind = "action" | "toggle" | "nav" | "danger";

export interface RadialItem {
  id: string;
  label: string;
  /** Screen-reader name when it should differ from the label. */
  ariaLabel?: string;
  icon?: RadialIconName;
  /** Defaults to "action". */
  kind?: RadialItemKind;
  /** Fill of an action option (any CSS colour). Defaults to blue-600. */
  color?: string;
  /** State of a toggle. */
  on?: boolean;
  /** Marks the current value when editing. */
  current?: boolean;
}

export interface RadialSection<T extends RadialItem = RadialItem> {
  label?: string;
  items: T[];
}

export interface RadialCenter {
  content: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  /** Colour of a ring around the centre, e.g. the team colour. */
  color?: string;
}

export interface RadialMenuProps<T extends RadialItem = RadialItem> {
  /** Tap point in container px. */
  anchor: Point;
  sections: RadialSection<T>[];
  center?: RadialCenter;
  onPick: (item: T) => void;
  onClose: () => void;
  /** Accessible name of the menu. */
  ariaLabel?: string;
  /** Space to keep clear, e.g. for a floating bar. */
  insets?: Partial<Insets>;
  /** Container size; measured from the overlay when left out. */
  bounds?: Size;
}

const DEFAULT_ACTION_COLOR = "#2563eb"; // blue-600

interface Look {
  fill?: string;
  shape: string;
  text: string;
  current: string;
}

const lookFor = (item: RadialItem): Look => {
  switch (item.kind ?? "action") {
    case "toggle":
      return item.on
        ? {
            shape: "fill-blue-600",
            text: "text-white",
            current: "stroke-white",
          }
        : {
            shape: "fill-white stroke-gray-300",
            text: "text-gray-800",
            current: "stroke-blue-600",
          };
    case "nav":
      return {
        shape: "fill-blue-50 stroke-blue-200",
        text: "text-blue-800",
        current: "stroke-blue-600",
      };
    case "danger":
      return {
        shape: "fill-red-50 stroke-red-200",
        text: "text-red-700",
        current: "stroke-red-700",
      };
    default:
      return {
        fill: item.color ?? DEFAULT_ACTION_COLOR,
        shape: "",
        text: "text-white",
        current: "stroke-white",
      };
  }
};

/** Labels longer than this with a space are split over two lines. */
const WRAP_AFTER = 7;

const labelLines = (label: string): string[] =>
  label.length > WRAP_AFTER && label.includes(" ")
    ? label.split(" ").slice(0, 2)
    : [label];

const isActivationKey = (key: string) => key === "Enter" || key === " ";

/**
 * A ring of options around a tap point, drawn as annular sectors grouped into
 * labelled sections. The menu knows nothing about what it edits: options come
 * from props and picks go back through onPick. Toggles do not close the menu;
 * the caller decides what each pick does.
 */
function RadialMenu<T extends RadialItem = RadialItem>({
  anchor,
  sections,
  center,
  onPick,
  onClose,
  ariaLabel = "Options",
  insets,
  bounds: boundsProp,
}: RadialMenuProps<T>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Size | undefined>();
  const bounds = boundsProp ?? measured;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Measure the container the overlay fills, and follow resizes
  useLayoutEffect(() => {
    if (boundsProp) return;
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      setMeasured((prev) =>
        prev && prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [boundsProp]);

  // Move focus into the menu, and back to where it was when it closes
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    rootRef.current?.focus({ preventScroll: true });
    return () => previouslyFocused?.focus?.({ preventScroll: true });
  }, []);

  // Esc closes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const layout = layoutRadial({
    anchor,
    sectionSizes: sections.map((s) => s.items.length),
    bounds,
    insets: { ...NO_INSETS, ...insets },
  });
  const { center: c, inner, outer } = layout;
  const labelRadius = (inner + outer) / 2 + 4;
  const origin = `${c.x}px ${c.y}px`;

  const pick = (item: T) => (event: React.SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onPick(item);
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={ariaLabel}
      tabIndex={-1}
      className="absolute inset-0 z-40 select-none focus:outline-none"
      data-html2canvas-ignore="true"
      data-testid="radial-menu"
    >
      <div
        className="absolute inset-0 bg-gray-900/15 transition-opacity duration-150 motion-reduce:transition-none starting:opacity-0"
        onClick={() => onClose()}
        data-testid="radial-backdrop"
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter
            id={`${id}-shadow`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#111827"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        {layout.moved && (
          <line
            x1={anchor.x}
            y1={anchor.y}
            x2={c.x}
            y2={c.y}
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="3 5"
            strokeLinecap="round"
            opacity={0.9}
            data-testid="radial-leader"
          />
        )}
        {layout.moved && (
          <g data-testid="radial-tap-mark">
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={8}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
            />
            <circle cx={anchor.x} cy={anchor.y} r={2.5} fill="#ffffff" />
          </g>
        )}

        <g
          className="transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none starting:scale-75 starting:opacity-0"
          style={{ transformOrigin: origin }}
        >
          <circle
            cx={c.x}
            cy={c.y}
            r={outer + RING_RIM}
            fill="#ffffff"
            filter={`url(#${id}-shadow)`}
            className="pointer-events-auto"
            data-testid="radial-ring"
          />

          {layout.segments.map((seg) => {
            const item = sections[seg.sectionIndex].items[seg.itemIndex];
            const kind = item.kind ?? "action";
            const look = lookFor(item);
            const path = sectorPath(c, inner, outer, seg.start, seg.end);
            const words = labelLines(item.label);
            const glyph: RadialIconName | undefined =
              kind === "toggle" ? (item.on ? "check" : "plus") : item.icon;
            const t = polar(c, labelRadius, seg.mid);
            const textY = t.y + (glyph ? 9 : 4) - (words.length - 1) * 6;
            return (
              <g
                key={`${seg.sectionIndex}-${item.id}`}
                role="button"
                tabIndex={0}
                aria-label={item.ariaLabel ?? item.label}
                aria-pressed={kind === "toggle" ? !!item.on : undefined}
                aria-current={item.current ? "true" : undefined}
                data-kind={kind}
                data-item-id={item.id}
                className={`group pointer-events-auto cursor-pointer outline-none ${look.text}`}
                onClick={pick(item)}
                onKeyDown={(event) => {
                  if (isActivationKey(event.key)) pick(item)(event);
                }}
              >
                <path
                  d={path}
                  fill={look.fill}
                  strokeWidth={1}
                  className={`${look.shape} transition-[filter] group-hover:brightness-105 group-focus-visible:stroke-gray-900 group-focus-visible:stroke-3 group-active:brightness-90`}
                />
                {item.current && (
                  <path
                    d={sectorPath(
                      c,
                      inner + 2.5,
                      outer - 2.5,
                      seg.start,
                      seg.end,
                      7,
                    )}
                    fill="none"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    className={look.current}
                    data-testid="radial-current"
                  />
                )}
                {glyph && (
                  <RadialIcon
                    name={glyph}
                    x={t.x - 8}
                    y={textY - 26}
                    size={16}
                    className="pointer-events-none"
                  />
                )}
                <text
                  x={t.x}
                  y={textY}
                  textAnchor="middle"
                  fill="currentColor"
                  className="pointer-events-none text-[11px] leading-none font-semibold"
                >
                  {words.map((word, k) => (
                    <tspan key={k} x={t.x} dy={k ? 12 : 0}>
                      {word}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* Section labels go last so they sit above the segments */}
          {layout.sections.map((section, i) => {
            const text = sections.filter((s) => s.items.length > 0)[i]?.label;
            if (!text) return null;
            const upper = text.toUpperCase();
            const pos = sectionLabelPosition(
              c,
              outer,
              section.mid,
              upper,
              bounds,
            );
            const w = labelWidth(upper);
            return (
              <g
                key={`label-${i}`}
                className="pointer-events-none"
                data-testid="radial-section-label"
              >
                <rect
                  x={pos.x - w / 2}
                  y={pos.y - LABEL_HEIGHT / 2}
                  width={w}
                  height={LABEL_HEIGHT}
                  rx={LABEL_HEIGHT / 2}
                  fill="#ffffff"
                  stroke="#e5e7eb"
                />
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  className="fill-gray-600 text-[10px] font-semibold tracking-wider"
                >
                  {upper}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {center &&
        (() => {
          const style: React.CSSProperties = {
            left: c.x,
            top: c.y,
            transformOrigin: "center",
            boxShadow: center.color
              ? `0 0 0 4px ${center.color}, 0 4px 12px rgb(0 0 0 / 0.2)`
              : undefined,
          };
          const cls =
            "absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white p-1 text-center text-[11px] leading-tight text-gray-800 shadow-lg transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none starting:scale-75 starting:opacity-0";
          return center.onClick ? (
            <button
              type="button"
              aria-label={center.ariaLabel}
              className={`${cls} cursor-pointer hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-gray-100`}
              style={style}
              onClick={(event) => {
                event.stopPropagation();
                center.onClick?.();
              }}
              data-testid="radial-center"
            >
              {center.content}
            </button>
          ) : (
            <div
              role="img"
              aria-label={center.ariaLabel}
              className={cls}
              style={style}
              data-testid="radial-center"
            >
              {center.content}
            </div>
          );
        })()}
    </div>
  );
}

export default RadialMenu;
