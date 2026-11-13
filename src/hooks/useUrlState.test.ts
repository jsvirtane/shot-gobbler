import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUrlState } from "./useUrlState";

const ALLOWED: readonly string[] = [
  "default",
  "custom",
  "newValue",
  "new",
  "old",
  "value1",
  "value2",
];

describe("useUrlState", () => {
  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState({}, "", "/");
  });

  it("should initialize with default value when no URL parameter exists", () => {
    const { result } = renderHook(() =>
      useUrlState("test", "default", ALLOWED),
    );

    expect(result.current[0]).toBe("default");
  });

  it("should initialize with URL parameter value when it exists", () => {
    window.history.replaceState({}, "", "/?test=custom");

    const { result } = renderHook(() =>
      useUrlState("test", "default", ALLOWED),
    );

    expect(result.current[0]).toBe("custom");
  });

  it("should update URL when state changes", () => {
    const { result } = renderHook(() =>
      useUrlState<string>("test", "default", ALLOWED),
    );

    act(() => {
      result.current[1]("newValue");
    });

    expect(window.location.search).toBe("?test=newValue");
    expect(result.current[0]).toBe("newValue");
  });

  it("should remove parameter from URL when setting to default value", () => {
    window.history.replaceState({}, "", "/?test=custom");

    const { result } = renderHook(() =>
      useUrlState("test", "default", ALLOWED),
    );

    act(() => {
      result.current[1]("default");
    });

    expect(window.location.search).toBe("");
    expect(result.current[0]).toBe("default");
  });

  it("should preserve other URL parameters when updating", () => {
    window.history.replaceState({}, "", "/?other=value&test=old");

    const { result } = renderHook(() =>
      useUrlState<string>("test", "default", ALLOWED),
    );

    act(() => {
      result.current[1]("new");
    });

    expect(window.location.search).toContain("other=value");
    expect(window.location.search).toContain("test=new");
    expect(result.current[0]).toBe("new");
  });

  it("should handle popstate events (browser back/forward)", () => {
    const { result } = renderHook(() =>
      useUrlState<string>("test", "default", ALLOWED),
    );

    // Set initial value
    act(() => {
      result.current[1]("value1");
    });

    expect(result.current[0]).toBe("value1");

    // Simulate browser back button by manually updating URL and triggering popstate
    act(() => {
      window.history.replaceState({}, "", "/?test=value2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toBe("value2");
  });

  it("should clean up popstate listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useUrlState("test", "default", ALLOWED),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should work with multiple instances for different keys", () => {
    const { result: result1 } = renderHook(() =>
      useUrlState<string>("key1", "default1", ALLOWED),
    );
    const { result: result2 } = renderHook(() =>
      useUrlState<string>("key2", "default2", ALLOWED),
    );

    act(() => {
      result1.current[1]("value1");
    });

    act(() => {
      result2.current[1]("value2");
    });

    expect(window.location.search).toContain("key1=value1");
    expect(window.location.search).toContain("key2=value2");
    expect(result1.current[0]).toBe("value1");
    expect(result2.current[0]).toBe("value2");
  });

  it("should not trigger page reload when updating URL", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    const { result } = renderHook(() =>
      useUrlState<string>("test", "default", ALLOWED),
    );

    act(() => {
      result.current[1]("newValue");
    });

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/?test=newValue");
    pushStateSpy.mockRestore();
  });

  describe("allowed values", () => {
    const VIEWS = ["pitch", "list"] as const;

    it("should fall back to default when URL value is not allowed", () => {
      window.history.replaceState({}, "", "/?view=bar");

      const { result } = renderHook(() => useUrlState("view", "pitch", VIEWS));

      expect(result.current[0]).toBe("pitch");
    });

    it("should fall back to default when URL value is empty", () => {
      window.history.replaceState({}, "", "/?view=");

      const { result } = renderHook(() => useUrlState("view", "pitch", VIEWS));

      expect(result.current[0]).toBe("pitch");
    });

    it("should accept an allowed non-default URL value", () => {
      window.history.replaceState({}, "", "/?view=list");

      const { result } = renderHook(() => useUrlState("view", "pitch", VIEWS));

      expect(result.current[0]).toBe("list");
    });

    it("should fall back to default on popstate with a disallowed value", () => {
      window.history.replaceState({}, "", "/?view=list");

      const { result } = renderHook(() => useUrlState("view", "pitch", VIEWS));
      expect(result.current[0]).toBe("list");

      act(() => {
        window.history.replaceState({}, "", "/?view=bar");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(result.current[0]).toBe("pitch");
    });

    it("should be case-sensitive", () => {
      window.history.replaceState({}, "", "/?view=LIST");

      const { result } = renderHook(() => useUrlState("view", "pitch", VIEWS));

      expect(result.current[0]).toBe("pitch");
    });
  });
});
