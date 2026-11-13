import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { jsonCodec, StorageCodec } from "../utils/dataSchema";

/**
 * useState that is loaded from and saved to localStorage.
 *
 * The codec decides how the value is stored. Pass `envelopeCodec(type)` for
 * app data so it is saved in a versioned envelope and migrated on load; the
 * default is plain JSON. A missing, unreadable or unusable stored value
 * falls back to `initial`, and the value is saved again on every change
 * (including the first render).
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
  codec: StorageCodec<T> = jsonCodec as StorageCodec<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return codec.parse(raw) ?? initial;
    } catch (error) {
      console.error(`Error loading "${key}" from localStorage:`, error);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, codec.stringify(value));
    } catch (error) {
      console.error(`Error saving "${key}" to localStorage:`, error);
    }
  }, [key, value, codec]);

  return [value, setValue];
}
