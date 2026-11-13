import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEnvelope, envelopeCodec } from "../utils/dataSchema";
import { useLocalStorageState } from "./useLocalStorageState";

const KEY = "test-key";
const shotsCodec = envelopeCodec<{ id: string }>("shots");

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("uses the initial value and saves it when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, [1, 2]));
    expect(result.current[0]).toEqual([1, 2]);
    expect(localStorage.getItem(KEY)).toBe("[1,2]");
  });

  it("loads an existing plain JSON value", () => {
    localStorage.setItem(KEY, '{"a":1}');
    const { result } = renderHook(() => useLocalStorageState(KEY, {}));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it("saves updates", () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, 0));
    act(() => result.current[1]((n) => n + 5));
    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem(KEY)).toBe("5");
  });

  it("falls back to the initial value for corrupted JSON", () => {
    localStorage.setItem(KEY, "not-json{");
    const { result } = renderHook(() => useLocalStorageState(KEY, ["x"]));
    expect(result.current[0]).toEqual(["x"]);
    expect(localStorage.getItem(KEY)).toBe('["x"]');
  });

  describe("with an envelope codec", () => {
    const initial: { id: string }[] = [];

    it("loads an old bare array and re-saves it in an envelope", () => {
      localStorage.setItem(KEY, JSON.stringify([{ id: "1" }]));
      const { result } = renderHook(() =>
        useLocalStorageState(KEY, initial, shotsCodec),
      );
      // Old data is assigned to the default match by the migration
      const migrated = [{ id: "1", matchId: "default-match" }];
      expect(result.current[0]).toEqual(migrated);
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(
        createEnvelope("shots", migrated),
      );
    });

    it("loads data stored in an envelope", () => {
      localStorage.setItem(
        KEY,
        JSON.stringify(createEnvelope("shots", [{ id: "2" }])),
      );
      const { result } = renderHook(() =>
        useLocalStorageState(KEY, initial, shotsCodec),
      );
      expect(result.current[0]).toEqual([{ id: "2" }]);
    });

    it("falls back to the initial value for an envelope of another type", () => {
      localStorage.setItem(
        KEY,
        JSON.stringify(createEnvelope("touches", [{ id: "3" }])),
      );
      const { result } = renderHook(() =>
        useLocalStorageState(KEY, initial, shotsCodec),
      );
      expect(result.current[0]).toEqual([]);
    });
  });
});
