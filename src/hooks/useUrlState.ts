import { useCallback, useEffect, useState } from "react";

/**
 * Custom hook to sync state with URL search parameters
 * @param key - The URL parameter key
 * @param defaultValue - The default value if parameter is not present
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  // Initialize state from URL or default
  const [state, setState] = useState<T>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paramValue = searchParams.get(key);
    return (paramValue as T) || defaultValue;
  });

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
      const searchParams = new URLSearchParams(window.location.search);
      const paramValue = searchParams.get(key);
      setState((paramValue as T) || defaultValue);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [key, defaultValue]);

  const setValue = useCallback((value: T) => {
    setState(value);
  }, []);

  return [state, setValue];
}
