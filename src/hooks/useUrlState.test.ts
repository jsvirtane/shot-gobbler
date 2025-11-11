import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUrlState } from "./useUrlState";

describe("useUrlState", () => {
  beforeEach(() => {
    // Reset URL before each test
    window.history.replaceState({}, "", "/");
  });

  it("should initialize with default value when no URL parameter exists", () => {
    const { result } = renderHook(() => useUrlState("test", "default"));

    expect(result.current[0]).toBe("default");
  });

  it("should initialize with URL parameter value when it exists", () => {
    window.history.replaceState({}, "", "/?test=custom");

    const { result } = renderHook(() => useUrlState("test", "default"));

    expect(result.current[0]).toBe("custom");
  });

  it("should update URL when state changes", () => {
    const { result } = renderHook(() => useUrlState<string>("test", "default"));

    act(() => {
      result.current[1]("newValue");
    });

    expect(window.location.search).toBe("?test=newValue");
    expect(result.current[0]).toBe("newValue");
  });

  it("should remove parameter from URL when setting to default value", () => {
    window.history.replaceState({}, "", "/?test=custom");

    const { result } = renderHook(() => useUrlState("test", "default"));

    act(() => {
      result.current[1]("default");
    });

    expect(window.location.search).toBe("");
    expect(result.current[0]).toBe("default");
  });

  it("should preserve other URL parameters when updating", () => {
    window.history.replaceState({}, "", "/?other=value&test=old");

    const { result } = renderHook(() => useUrlState<string>("test", "default"));

    act(() => {
      result.current[1]("new");
    });

    expect(window.location.search).toContain("other=value");
    expect(window.location.search).toContain("test=new");
    expect(result.current[0]).toBe("new");
  });

  it("should handle popstate events (browser back/forward)", () => {
    const { result } = renderHook(() => useUrlState<string>("test", "default"));

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

    const { unmount } = renderHook(() => useUrlState("test", "default"));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should work with multiple instances for different keys", () => {
    const { result: result1 } = renderHook(() =>
      useUrlState<string>("key1", "default1"),
    );
    const { result: result2 } = renderHook(() =>
      useUrlState<string>("key2", "default2"),
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

    const { result } = renderHook(() => useUrlState<string>("test", "default"));

    act(() => {
      result.current[1]("newValue");
    });

    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/?test=newValue");
    pushStateSpy.mockRestore();
  });
});
