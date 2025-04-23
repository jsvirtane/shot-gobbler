import React, { useEffect, useRef, useState } from "react";
import football_pitch from "../../assets/football_pitch.svg";
import { Shot } from "../../types/Shot";

interface FootballPitchProps {
  onPitchClick: (x: number, y: number) => void;
  shots: Shot[];
}

export const FootballPitch: React.FC<FootballPitchProps> = ({
  onPitchClick,
  shots,
}) => {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when component mounts or window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (pitchRef.current) {
        setDimensions({
          width: pitchRef.current.offsetWidth,
          height: pitchRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

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

  // Convert relative coordinates (0-100%) to absolute pixel coordinates
  const toAbsoluteCoordinates = (
    relX: number,
    relY: number,
    width: number,
    height: number,
  ) => {
    return {
      x: (relX / 100) * width,
      y: (relY / 100) * height,
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
      onPitchClick(relativeCoords.x, relativeCoords.y);
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

      {/* Visualize Shots */}
      {shots.map((shot) => {
        // Convert relative coordinates back to absolute for display
        const absCoords =
          dimensions.width && dimensions.height
            ? toAbsoluteCoordinates(
                shot.x,
                shot.y,
                dimensions.width,
                dimensions.height,
              )
            : { x: 0, y: 0 };

        // Determine color based on team and goal/miss
        const getColorClass = () => {
          if (shot.isGoal) {
            return shot.team === "home" ? "bg-yellow-400" : "bg-blue-400";
          } else {
            return shot.team === "home" ? "bg-red-500" : "bg-purple-500";
          }
        };

        return (
          <div
            onClick={handleClick} // Allow clicking on shots to trigger the pitch click close to them
            key={shot.id}
            className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform rounded-full border border-black shadow ${getColorClass()} z-10 opacity-80`}
            style={{
              left: `${absCoords.x}px`,
              top: `${absCoords.y}px`,
            }}
            title={`${shot.team} - (${shot.x.toFixed(1)}%, ${shot.y.toFixed(
              1,
            )}%) - ${shot.shotType} - ${shot.bodyPart}${
              shot.playerName ? " - " + shot.playerName : ""
            }`}
          ></div>
        );
      })}
    </div>
  );
};
export default FootballPitch;