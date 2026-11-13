import { useCallback, useEffect, useState } from "react";

/**
 * Read a URL parameter, falling back to the default when it is missing or not
 * one of the allowed values (e.g. a hand-edited or stale link).
 */
function readParam<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[],
): T {
  const paramValue = new URLSearchParams(window.location.search).get(key);
  return paramValue !== null &&
    (allowedValues as readonly string[]).includes(paramValue)
    ? (paramValue as T)
    : defaultValue;
}

/**
 * Custom hook to sync state with URL search parameters
 * @param key - The URL parameter key
 * @param defaultValue - The default value if parameter is missing or not allowed
 * @param allowedValues - The values accepted from the URL; anything else falls back to defaultValue
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[],
): [T, (value: T) => void] {
  // Initialize state from URL or default
  const [state, setState] = useState<T>(() =>
    readParam(key, defaultValue, allowedValues),
  );

  // Update URL when state changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (state === defaultValue) {
      // Remove parameter if it's the default value to keep URL clean
      searchParams.delete(key);
    } else {
      searchParams.set(key, state);
    }

    const newUrl = searchParams.toString()
      ? `${window.location.pathname}?${searchParams.toString()}`
      : window.location.pathname;

    // Only update URL if it's different from current
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (newUrl !== currentUrl) {
      // Use pushState to create history entries for browser back/forward
      window.history.pushState({}, "", newUrl);
    }
  }, [key, state, defaultValue]);

  // Listen for popstate events (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setState(readParam(key, defaultValue, allowedValues));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [key, defaultValue, allowedValues]);

  const setValue = useCallback((value: T) => {
    setState(value);
  }, []);

  return [state, setValue];
}
