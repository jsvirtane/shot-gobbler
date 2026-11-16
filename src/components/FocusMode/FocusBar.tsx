import React, { useEffect, useState } from "react";
import { useNow } from "../../hooks/useNow";
import { MatchClock } from "../../types/Match";
import { DataTab } from "../../types/Tab";
import { formatClock } from "../../utils/matchClock";
import { FADE_AFTER_MS, nextTracker, TrackerControls } from "./trackerControls";

const TRACKERS: Record<DataTab, { icon: string; label: string }> = {
  shots: { icon: "⚽", label: "Shots" },
  touches: { icon: "👟", label: "Touches" },
  "pass-chains": { icon: "🔗", label: "Chains" },
};

type FocusBarProps = {
  tracker: DataTab;
  onSwitchTracker: (tab: DataTab) => void;
  clock: MatchClock | undefined;
  /** Starts or pauses the match clock. */
  onToggleClock: () => void;
  /** The active tracker's controls; undo is disabled until it registers. */
  controls: TrackerControls | null;
  onExit: () => void;
};

/** Colours of a button that is not switched on. */
const offColors = "text-gray-700 hover:bg-gray-100";

const buttonClass =
  "flex h-11 min-w-11 items-center justify-center rounded-full px-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30";

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** True after FADE_AFTER_MS without a touch, click or key press. */
const useIdle = () => {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = window.setTimeout(() => setIdle(true), FADE_AFTER_MS);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), FADE_AFTER_MS);
    };
    const events = ["pointerdown", "touchstart", "keydown"] as const;
    for (const e of events) {
      document.addEventListener(e, wake, { capture: true, passive: true });
    }
    return () => {
      window.clearTimeout(timer);
      for (const e of events) {
        document.removeEventListener(e, wake, { capture: true });
      }
    };
  }, []);
  return idle;
};

/**
 * The floating control bar of focus mode: a white pill at the bottom of
 * the screen, inside the safe area. It fades after a while without input
 * and comes back on any touch.
 */
const FocusBar: React.FC<FocusBarProps> = ({
  tracker,
  onSwitchTracker,
  clock,
  onToggleClock,
  controls,
  onExit,
}) => {
  const idle = useIdle();
  const running = clock?.running ?? false;
  const now = useNow(running);
  const clockText = formatClock(clock, now);
  const current = TRACKERS[tracker];
  const next = TRACKERS[nextTracker(tracker)];
  const pitch = controls?.pitch;

  return (
    <div
      role="toolbar"
      aria-label="Focus mode controls"
      data-testid="focus-bar"
      data-idle={idle || undefined}
      className={`fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 transition-opacity duration-300 ${
        idle ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex h-14 items-center gap-0.5 rounded-full bg-white px-1.5 shadow-lg">
        <button
          type="button"
          onClick={() => onSwitchTracker(nextTracker(tracker))}
          aria-label={`Tracker: ${current.label}. Switch to ${next.label}`}
          title={`Switch to ${next.label}`}
          className={`${buttonClass} ${offColors}`}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {current.icon}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleClock}
          disabled={clock?.period === "PEN"}
          aria-label={`Match clock ${clockText}. ${running ? "Pause" : "Start"} clock`}
          data-testid="focus-clock"
          className={`${buttonClass} ${offColors} gap-1.5 px-3 text-sm font-semibold tabular-nums`}
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              running ? "bg-green-500" : clock ? "bg-amber-500" : "bg-gray-300"
            }`}
          />
          {clockText}
        </button>

        {pitch && (
          <button
            type="button"
            onClick={pitch.toggle}
            aria-pressed={pitch.half}
            aria-label="Half pitch"
            title={pitch.half ? "Show full pitch" : "Show half pitch"}
            className={`${buttonClass} ${pitch.half ? "bg-blue-50 text-blue-600" : offColors}`}
          >
            <Icon>
              <rect x="6" y="3" width="12" height="18" rx="1" />
              {pitch.half ? (
                <rect
                  x="6"
                  y="3"
                  width="12"
                  height="9"
                  fill="currentColor"
                  stroke="none"
                />
              ) : (
                <line x1="6" y1="12" x2="18" y2="12" />
              )}
            </Icon>
          </button>
        )}

        {/* Team toggle for the half pitch goes here (#88) */}

        <button
          type="button"
          onClick={() => controls?.undo()}
          disabled={!controls?.canUndo}
          aria-label="Undo"
          title="Undo"
          className={`${buttonClass} ${offColors}`}
        >
          <Icon>
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </Icon>
        </button>

        <button
          type="button"
          onClick={onExit}
          aria-label="Exit focus mode"
          title="Exit focus mode"
          className={`${buttonClass} ${offColors}`}
        >
          <Icon>
            <path d="M4 14h6v6" />
            <path d="M20 10h-6V4" />
            <path d="M14 10l7-7" />
            <path d="M3 21l7-7" />
          </Icon>
        </button>
      </div>
    </div>
  );
};

export default FocusBar;
