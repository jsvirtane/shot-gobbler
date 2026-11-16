import { describe, expect, it } from "vitest";
import { dropRetiredStorageKeys, RETIRED_STORAGE_KEYS } from "./retiredStorage";

describe("dropRetiredStorageKeys", () => {
  it("removes the quick entry and remembered-choice keys only", () => {
    localStorage.setItem("shot-gobbler-quick-mode", "true");
    localStorage.setItem("shot-gobbler-shot-defaults", "{}");
    localStorage.setItem("shot-gobbler-shots", "[]");
    dropRetiredStorageKeys();
    RETIRED_STORAGE_KEYS.forEach((key) =>
      expect(localStorage.getItem(key)).toBeNull(),
    );
    expect(localStorage.getItem("shot-gobbler-shots")).toBe("[]");
  });

  it("ignores storage that throws", () => {
    const throwing = {
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => dropRetiredStorageKeys(throwing)).not.toThrow();
  });
});
