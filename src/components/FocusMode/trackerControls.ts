import { createContext, useContext, useEffect, useRef } from "react";
import { DataTab } from "../../types/Tab";

/** Time without input before the focus bar fades. */
export const FADE_AFTER_MS = 3500;

/** Tracker order for the bar's switch, which cycles through them. */
export const TRACKER_ORDER: readonly DataTab[] = [
  "shots",
  "touches",
  "pass-chains",
];

export const nextTracker = (tab: DataTab): DataTab =>
  TRACKER_ORDER[(TRACKER_ORDER.indexOf(tab) + 1) % TRACKER_ORDER.length];

/**
 * What the focus mode bar can do in the active tracker (view). Each view
 * owns its data and undo history and registers these with
 * `useTrackerControls`; the bar in App reads them.
 */
export type TrackerControls = {
  /** Reverts the latest change (or in-progress point). */
  undo: () => void;
  canUndo: boolean;
  /** Half/full pitch switch, for trackers that have one. */
  pitch?: { half: boolean; toggle: () => void };
  /** Team for new events in the half pitch view, shown with a switch. */
  team?: { name: string; color: string; toggle: () => void };
};

type Register = (controls: TrackerControls | null) => void;

export const TrackerControlsContext = createContext<Register>(() => {});

/**
 * Registers the view's controls for the focus mode bar while it is mounted.
 * The callbacks may change identity on every render; the bar always calls
 * the latest ones.
 */
export function useTrackerControls(controls: TrackerControls) {
  const register = useContext(TrackerControlsContext);
  const latest = useRef(controls);
  useEffect(() => {
    latest.current = controls;
  });

  const { canUndo } = controls;
  const hasPitch = controls.pitch !== undefined;
  const half = controls.pitch?.half ?? false;
  const teamName = controls.team?.name;
  const teamColor = controls.team?.color;
  useEffect(() => {
    register({
      undo: () => latest.current.undo(),
      canUndo,
      pitch: hasPitch
        ? { half, toggle: () => latest.current.pitch?.toggle() }
        : undefined,
      team:
        teamName !== undefined && teamColor !== undefined
          ? {
              name: teamName,
              color: teamColor,
              toggle: () => latest.current.team?.toggle(),
            }
          : undefined,
    });
  }, [register, canUndo, hasPitch, half, teamName, teamColor]);

  useEffect(() => () => register(null), [register]);
}
