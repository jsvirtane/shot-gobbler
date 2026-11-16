/** localStorage key of the vibration setting ("0" = off). */
export const HAPTICS_STORAGE_KEY = "shot-gobbler-haptics";

/** Length of the buzz on a save, move or delete, in ms. */
export const SAVE_VIBRATION_MS = 12;

/** Whether saves vibrate; on unless switched off. */
export const hapticsEnabled = (): boolean => {
  try {
    return localStorage.getItem(HAPTICS_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
};

export const setHapticsEnabled = (on: boolean): void => {
  try {
    localStorage.setItem(HAPTICS_STORAGE_KEY, on ? "1" : "0");
  } catch {
    // Not remembered when storage is unavailable
  }
};

/**
 * A short buzz so a save is noticed without looking at the phone. Does
 * nothing where vibration isn't supported (e.g. iOS) or is switched off.
 */
export const vibrateOnSave = (): void => {
  if (!hapticsEnabled()) return;
  try {
    navigator.vibrate?.(SAVE_VIBRATION_MS);
  } catch {
    // Some browsers throw when vibration is blocked
  }
};

/** The item added or changed last, so its marker can pulse once. */
export type Pulse = { id: string; key: number };

/** The pulse key for an item: set only for the item changed last. */
export const pulseKeyFor = (
  pulse: Pulse | null | undefined,
  id: string,
): number | undefined => (pulse?.id === id ? pulse.key : undefined);
