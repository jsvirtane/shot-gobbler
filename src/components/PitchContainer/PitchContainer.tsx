import React, { forwardRef, useRef } from "react";
import football_pitch from "../../assets/football_pitch.svg";

interface PitchContainerProps {
  onCoordinateClick: (x: number, y: number) => void;
  children?: React.ReactNode;
}

export const PitchContainer = forwardRef<HTMLDivElement, PitchContainerProps>(
  ({ onCoordinateClick, children }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    const pitchRef = (ref || localRef) as React.RefObject<HTMLDivElement>;

    // Convert absolute pixel coordinates to relative coordinates (0-100%)
    const toRelativeCoordinates = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      return {
        x: (x / width) * 100,
        y: (y / height) * 100,
      };
    };

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!pitchRef.current) return;

      // Get pitch element's position relative to the viewport
      const rect = pitchRef.current.getBoundingClientRect();

      // Calculate coordinates relative to the pitch element
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Basic boundary check
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        // Convert to relative coordinates before passing to parent
        const relativeCoords = toRelativeCoordinates(
          x,
          y,
          rect.width,
          rect.height,
        );
        onCoordinateClick(relativeCoords.x, relativeCoords.y);
      }
    };

    return (
      <div
        ref={pitchRef}
        className="relative flex w-full cursor-crosshair items-center justify-center overflow-hidden"
        onClick={handleClick}
      >
        <img
          src={football_pitch}
          alt="Football Pitch"
          className="block aspect-[74/110] h-auto w-full bg-green-700"
        />
        {children}
      </div>
    );
  },
);

PitchContainer.displayName = "PitchContainer";

export default PitchContainer;
