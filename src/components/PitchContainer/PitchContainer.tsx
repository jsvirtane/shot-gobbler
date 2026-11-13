import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import football_pitch from "../../assets/football_pitch.svg";
import { PitchVariant } from "../../utils/pitchView";
import { PitchApi, PitchContext } from "./pitchContext";

/** Width:height ratio of the full pitch image. */
const PITCH_RATIO = 74 / 110;

/** Share of the full pitch height shown by each variant. */
const VISIBLE_HEIGHT: Record<PitchVariant, number> = {
  full: 1,
  "half-top": 0.5,
};

/**
 * Default vertical space (nav bar, page padding, view controls and labels)
 * reserved outside the pitch so that the whole pitch fits in the viewport.
 */
const DEFAULT_RESERVED_HEIGHT = "16rem";

/** Narrowest shared-image area, so a legend fits in two rows. */
const LEGEND_MIN_WIDTH = "22rem";

interface PitchContainerProps {
  /** Called with full-pitch % coordinates (0-100) of the clicked point. */
  onCoordinateClick: (x: number, y: number) => void;
  /**
   * "full" shows the whole pitch. "half-top" crops to the top half (y 0-50),
   * zoomed to fill the width. Coordinates (clicks and child positions) are
   * always in full-pitch % in both variants.
   */
  variant?: PitchVariant;
  /** CSS length of the viewport height not available to the pitch. */
  reservedHeight?: string;
  /**
   * Key shown under the pitch. It is inside the shared-image area, so it
   * also appears in shared images.
   */
  legend?: React.ReactNode;
  /** Markers positioned with `left: x%` / `top: y%` of the full pitch. */
  children?: React.ReactNode;
}

export const PitchContainer = forwardRef<HTMLDivElement, PitchContainerProps>(
  (
    {
      onCoordinateClick,
      variant = "full",
      reservedHeight = DEFAULT_RESERVED_HEIGHT,
      legend,
      children,
    },
    ref,
  ) => {
    const localRef = useRef<HTMLDivElement>(null);
    const pitchRef = (ref || localRef) as React.RefObject<HTMLDivElement>;

    const visibleHeight = VISIBLE_HEIGHT[variant];
    const aspectRatio = PITCH_RATIO / visibleHeight;
    // Shrink the width when the height would overflow the viewport
    const pitchWidth = `min(100%, calc((100dvh - ${reservedHeight}) * ${aspectRatio}))`;

    // Time until which pitch clicks are ignored (set when a marker drag ends)
    const suppressClickUntil = useRef(0);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!pitchRef.current) return;
      if (Date.now() < suppressClickUntil.current) return;

      // The bounding rect is the visible (possibly cropped) area
      const rect = pitchRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        // Visible area starts at the top goal line, so scaling by the visible
        // share gives full-pitch % coordinates
        onCoordinateClick(
          (x / rect.width) * 100,
          (y / rect.height) * 100 * visibleHeight,
        );
      }
    };

    const toPitchPoint = useCallback(
      (clientX: number, clientY: number) => {
        if (!pitchRef.current) return null;
        const rect = pitchRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        const clamp = (v: number) => Math.min(1, Math.max(0, v));
        return {
          x: clamp((clientX - rect.left) / rect.width) * 100,
          y: clamp((clientY - rect.top) / rect.height) * 100 * visibleHeight,
        };
      },
      [pitchRef, visibleHeight],
    );

    const pitchApi = useMemo<PitchApi>(
      () => ({
        toPitchPoint,
        suppressNextClick: () => {
          suppressClickUntil.current = Date.now() + 400;
        },
      }),
      [toPitchPoint],
    );

    return (
      <div className="flex w-full justify-center">
        <div
          // Captured for shared images: the pitch plus its legend
          id="share-pitch"
          data-variant={variant}
          className="flex flex-col items-center"
          style={{
            // At least wide enough for a compact legend, even when the pitch
            // is narrow
            width: `max(min(100%, ${LEGEND_MIN_WIDTH}), ${pitchWidth})`,
          }}
          // Clicks outside the pitch (on the legend) are ignored
          onClick={handleClick}
        >
          <div
            ref={pitchRef}
            data-testid="pitch"
            className="relative cursor-crosshair overflow-hidden"
            style={{ aspectRatio, width: pitchWidth }}
          >
            {/* Full pitch; taller than the visible area when cropped */}
            <div
              className="absolute inset-x-0 top-0"
              style={{ height: `${100 / visibleHeight}%` }}
            >
              <img
                src={football_pitch}
                alt="Football Pitch"
                className="block h-full w-full bg-green-700"
              />
              <PitchContext.Provider value={pitchApi}>
                {children}
              </PitchContext.Provider>
            </div>
          </div>
          {legend}
        </div>
      </div>
    );
  },
);

PitchContainer.displayName = "PitchContainer";

export default PitchContainer;
