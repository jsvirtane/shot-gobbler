import { useCallback, useState } from "react";
import { useUrlState } from "./useUrlState";

export const FOCUS_MODE_STORAGE_KEY = "shot-gobbler-focus-mode";
export const FOCUS_PARAM = "focus";
const FOCUS_VALUES = ["0", "1"] as const;
type FocusValue = (typeof FOCUS_VALUES)[number];

const loadFocusMode = (): boolean => {
  try {
    return localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const saveFocusMode = (on: boolean) => {
  try {
    localStorage.setItem(FOCUS_MODE_STORAGE_KEY, on ? "1" : "0");
  } catch {
    // Not remembered when storage is unavailable
  }
};

/**
 * Puts the remembered mode into the URL when the URL doesn't say, before
 * the URL state reads it. Replaces the entry, so no extra history step.
 */
const restoreRememberedMode = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has(FOCUS_PARAM) || !loadFocusMode()) return;
  params.set(FOCUS_PARAM, "1");
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}?${params.toString()}`,
  );
};

/**
 * Focus mode (full-screen pitch with a floating bar) or review mode (the
 * normal layout). Kept in the URL (`?focus=1`) and remembered across visits.
 */
export function useFocusMode(): [boolean, (on: boolean) => void] {
  // Runs once, before useUrlState's own initial read below
  useState(restoreRememberedMode);
  const [value, setValue] = useUrlState<FocusValue>(
    FOCUS_PARAM,
    "0",
    FOCUS_VALUES,
  );
  const setFocus = useCallback(
    (on: boolean) => {
      setValue(on ? "1" : "0");
      saveFocusMode(on);
    },
    [setValue],
  );
  return [value === "1", setFocus];
}
