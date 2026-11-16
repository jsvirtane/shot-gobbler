/**
 * localStorage keys from features that no longer exist: the quick entry
 * switch and the shot form's remembered choices (both replaced by the
 * radial menu).
 */
export const RETIRED_STORAGE_KEYS = [
  "shot-gobbler-quick-mode",
  "shot-gobbler-shot-defaults",
] as const;

/** Removes the retired keys so they don't linger in people's browsers. */
export const dropRetiredStorageKeys = (
  storage: Pick<Storage, "removeItem"> | undefined = globalThis.localStorage,
): void => {
  try {
    RETIRED_STORAGE_KEYS.forEach((key) => storage?.removeItem(key));
  } catch {
    // Storage unavailable (private mode etc.): nothing to clean up
  }
};
