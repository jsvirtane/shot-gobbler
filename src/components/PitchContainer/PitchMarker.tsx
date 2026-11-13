import React, { useEffect, useRef, useState } from "react";
import { PitchPoint } from "../../utils/pitchView";
import { usePitch } from "./pitchContext";

/** How long a press must be held before the marker can be dragged. */
export const LONG_PRESS_MS = 400;
/** Movement (px) that cancels a pending long press (the user is scrolling). */
const MOVE_TOLERANCE_PX = 10;

interface PitchMarkerProps {
  /** Position in full-pitch % coordinates, as displayed. */
  x: number;
  y: number;
  /** Accessible name and tooltip. */
  label: string;
  /** Tap / click / Enter on the marker. The pitch does not get the click. */
  onTap?: () => void;
  /** Long-press then drag: called on release with the displayed drop point. */
  onMove?: (x: number, y: number) => void;
  /** Extra classes for the hit area, e.g. a z-index. */
  className?: string;
  testId?: string;
  /** The visible marker, drawn centred in the hit area. */
  children: React.ReactNode;
}

/**
 * Positions a marker on the pitch inside a 44x44 px hit area. Without
 * handlers it ignores pointer events so taps reach the pitch below.
 */
export const PitchMarker: React.FC<PitchMarkerProps> = ({
  x,
  y,
  label,
  onTap,
  onMove,
  className = "",
  testId,
  children,
}) => {
  const { toPitchPoint, suppressNextClick } = usePitch();
  const [lifted, setLifted] = useState(false);
  const [dragPos, setDragPos] = useState<PitchPoint | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const liftedRef = useRef(false);
  const dragPosRef = useRef<PitchPoint | null>(null);
  const suppressClick = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const reset = () => {
    clearTimer();
    start.current = null;
    liftedRef.current = false;
    dragPosRef.current = null;
    setLifted(false);
    setDragPos(null);
  };

  const interactive = Boolean(onTap || onMove);
  const shown = dragPos ?? { x, y };
  const position: React.CSSProperties = {
    left: `${shown.x}%`,
    top: `${shown.y}%`,
  };
  const box = `absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center ${className}`;

  if (!interactive) {
    return (
      <div
        className={`pointer-events-none ${box}`}
        style={position}
        title={label}
        data-testid={testId}
      >
        {children}
      </div>
    );
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    suppressClick.current = false;
    if (!onMove) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
    // Keep receiving moves when the pointer leaves the small hit area
    event.currentTarget.setPointerCapture?.(event.pointerId);
    clearTimer();
    timer.current = setTimeout(() => {
      timer.current = null;
      liftedRef.current = true;
      setLifted(true);
      navigator.vibrate?.(10);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    if (!liftedRef.current) {
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) clearTimer();
      return;
    }
    event.preventDefault();
    const point = toPitchPoint(event.clientX, event.clientY);
    if (point) {
      dragPosRef.current = point;
      setDragPos(point);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (liftedRef.current) {
      event.preventDefault();
      // A long press is never also a tap, and the click that may follow
      // must not reach the pitch either
      suppressClick.current = true;
      suppressNextClick();
      const drop = dragPosRef.current;
      if (drop && onMove) onMove(drop.x, drop.y);
    }
    reset();
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onTap?.();
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      data-dragging={lifted || undefined}
      className={`pointer-events-auto cursor-pointer rounded-full select-none focus-visible:outline-2 focus-visible:outline-white ${box} ${lifted ? "z-50" : ""}`}
      style={{
        ...position,
        // Dragging must not scroll the page; also no iOS long-press callout
        touchAction: onMove ? "none" : undefined,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={reset}
      onClick={handleClick}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span
        className={`flex items-center justify-center transition-transform duration-150 ${lifted ? "scale-150 drop-shadow-lg" : ""}`}
      >
        {children}
      </span>
    </button>
  );
};

export default PitchMarker;
