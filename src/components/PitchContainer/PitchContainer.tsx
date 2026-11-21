import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import football_pitch from "../../assets/football_pitch.svg";
import futsal_pitch from "../../assets/futsal_pitch.svg";
import { PitchType } from "../../types/Pitch";
import { pitchSpec } from "../../utils/pitchSpecs";
import {
  fromVisibleShare,
  PITCH_WINDOW,
  PitchVariant,
} from "../../utils/pitchView";
import { PitchApi, PitchContext } from "./pitchContext";
import { usePitchType } from "./pitchTypeContext";

/** Image and alt text of each pitch type, drawn in its box. */
const PITCH_IMAGES: Record<PitchType, { src: string; alt: string }> = {
  football: { src: football_pitch, alt: "Football Pitch" },
  futsal: { src: futsal_pitch, alt: "Futsal Pitch" },
};

/**
 * Vertical space reserved outside the pitch in review mode so that the
 * whole pitch fits in the viewport: the 3.75rem nav bar, the header (match
 * row and view switch), page padding, and the review card's filter bar,
 * legend and summary. The nav bar is at the top on wide screens and at the
 * bottom on phones; the safe-area insets around it are added on top of
 * this.
 */
export const REVIEW_RESERVED_HEIGHT = "20.25rem";

/** Narrowest shared-image area, so a legend fits in two rows. */
const LEGEND_MIN_WIDTH = "22rem";

/** Notch and home-indicator insets, outside the app's own layout. */
const SAFE_AREA_HEIGHT =
  "(env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))";

interface PitchContainerProps {
  /** Called with full-pitch % coordinates (0-100) of the clicked point. */
  onCoordinateClick: (x: number, y: number) => void;
  /**
   * "full" shows the whole pitch. "half" crops to the bottom half (y 50-100),
   * zoomed to fill the width, so the goal there is at the bottom of the
   * screen. Coordinates (clicks and child positions) are always in
   * full-pitch % in both variants.
   */
  variant?: PitchVariant;
  /**
   * CSS length of the viewport height not available to the pitch, including
   * the nav bar but not the safe-area insets (those are added here).
   */
  reservedHeight?: string;
  /**
   * Key shown under the pitch. It is inside the shared-image area, so it
   * also appears in shared images.
   */
  legend?: React.ReactNode;
  /**
   * Shown between the pitch and the legend, inside the shared-image area
   * (e.g. the team at the bottom of the pitch).
   */
  belowPitch?: React.ReactNode;
  /**
   * Empty-state hint drawn over the pitch. Taps go through it, and it is
   * left out of shared images.
   */
  hint?: React.ReactNode;
  /**
   * Fill the parent instead of the viewport (focus mode): the pitch is as
   * large as the space the parent's flex layout gives it, keeping its
   * ratio. Takes `flex-1` in a column parent; `reservedHeight` is ignored.
   */
  fill?: boolean;
  /**
   * Small labels drawn inside the pitch at the top and bottom goal ends
   * (e.g. team names). Left out of shared images.
   */
  endLabels?: { top?: React.ReactNode; bottom?: React.ReactNode };
  /**
   * Keep the end labels in shared images (e.g. team names). By default they
   * are left out, as they describe how to track rather than the data.
   */
  endLabelsInShare?: boolean;
  /** Markers positioned with `left: x%` / `top: y%` of the full pitch. */
  children?: React.ReactNode;
}

const END_LABEL_CLASS =
  "pointer-events-none absolute inset-x-0 z-20 flex justify-center px-2";
const END_LABEL_TEXT_CLASS =
  "max-w-[70%] truncate rounded-full bg-white/85 px-2 py-0.5 text-xs font-semibold text-gray-800 shadow-sm";

export const PitchContainer = forwardRef<HTMLDivElement, PitchContainerProps>(
  (
    {
      onCoordinateClick,
      variant = "full",
      reservedHeight = REVIEW_RESERVED_HEIGHT,
      legend,
      belowPitch,
      hint,
      fill = false,
      endLabels,
      endLabelsInShare = false,
      children,
    },
    ref,
  ) => {
    const localRef = useRef<HTMLDivElement>(null);
    const pitchRef = (ref || localRef) as React.RefObject<HTMLDivElement>;

    // The current match's pitch: its image and box shape (width:height of
    // the full pitch)
    const pitchType = usePitchType();
    const pitchImage = PITCH_IMAGES[pitchType];
    const pitchRatio = pitchSpec(pitchType).boxAspectRatio;

    const pitchWindow = PITCH_WINDOW[variant];
    // Share of the full pitch height that is visible
    const visibleHeight = pitchWindow.height / 100;
    const aspectRatio = pitchRatio / visibleHeight;
    // Shrink the width when the height would overflow: the parent's height
    // (a size container, so cq units are its real size) or the viewport's
    const pitchWidth = fill
      ? `min(100cqw, calc(100cqh * ${aspectRatio}))`
      : `min(100%, calc((100dvh - ${reservedHeight} - ${SAFE_AREA_HEIGHT}) * ${aspectRatio}))`;

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
        // Full-pitch % of the point in the visible window
        const point = fromVisibleShare(
          { x: x / rect.width, y: y / rect.height },
          variant,
        );
        onCoordinateClick(point.x, point.y);
      }
    };

    const toPitchPoint = useCallback(
      (clientX: number, clientY: number) => {
        if (!pitchRef.current) return null;
        const rect = pitchRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        const clamp = (v: number) => Math.min(1, Math.max(0, v));
        return fromVisibleShare(
          {
            x: clamp((clientX - rect.left) / rect.width),
            y: clamp((clientY - rect.top) / rect.height),
          },
          variant,
        );
      },
      [pitchRef, variant],
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
      <div
        className={
          fill
            ? // The half pitch sits at the bottom, so its goal is under the
              // thumb
              `[container-type:size] flex min-h-0 w-full flex-1 justify-center ${
                variant === "half" ? "items-end" : "items-center"
              }`
            : "flex w-full justify-center"
        }
        data-fill={fill || undefined}
      >
        <div
          // Captured for shared images: the pitch plus its legend
          id="share-pitch"
          data-variant={variant}
          className="flex flex-col items-center"
          style={{
            // At least wide enough for a compact legend, even when the pitch
            // is narrow
            width: fill
              ? pitchWidth
              : `max(min(100%, ${LEGEND_MIN_WIDTH}), ${pitchWidth})`,
          }}
          // Clicks outside the pitch (on the legend) are ignored
          onClick={handleClick}
        >
          <div
            ref={pitchRef}
            data-testid="pitch"
            data-pitch-type={pitchType}
            className="relative cursor-crosshair overflow-hidden"
            style={{ aspectRatio, width: pitchWidth }}
          >
            {/* Full pitch; taller than the visible area when cropped, and
                shifted up so the visible window shows */}
            <div
              className="absolute inset-x-0"
              style={{
                height: `${100 / visibleHeight}%`,
                top: `${-pitchWindow.top / visibleHeight}%`,
              }}
            >
              <img
                src={pitchImage.src}
                alt={pitchImage.alt}
                className="block h-full w-full bg-green-700"
              />
              <PitchContext.Provider value={pitchApi}>
                {children}
              </PitchContext.Provider>
            </div>
            {hint && (
              <div
                data-html2canvas-ignore="true"
                data-testid="pitch-hint"
                className="pointer-events-none absolute inset-x-0 top-[38%] z-20 flex justify-center px-3"
              >
                <p className="max-w-[16rem] rounded-lg border border-blue-200 bg-blue-50/95 px-3 py-2 text-center text-sm text-blue-800 shadow-md">
                  {hint}
                </p>
              </div>
            )}
            {endLabels?.top && (
              <div
                data-html2canvas-ignore={endLabelsInShare ? undefined : "true"}
                data-testid="pitch-label-top"
                className={`${END_LABEL_CLASS} top-1`}
              >
                <span className={END_LABEL_TEXT_CLASS}>{endLabels.top}</span>
              </div>
            )}
            {endLabels?.bottom && (
              <div
                data-html2canvas-ignore={endLabelsInShare ? undefined : "true"}
                data-testid="pitch-label-bottom"
                className={`${END_LABEL_CLASS} bottom-1`}
              >
                <span className={END_LABEL_TEXT_CLASS}>{endLabels.bottom}</span>
              </div>
            )}
          </div>
          {belowPitch}
          {legend}
        </div>
      </div>
    );
  },
);

PitchContainer.displayName = "PitchContainer";

export default PitchContainer;
