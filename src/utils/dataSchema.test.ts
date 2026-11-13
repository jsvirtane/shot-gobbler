import { describe, expect, it } from "vitest";
import {
  APP_ID,
  CURRENT_VERSION,
  createEnvelope,
  DATA_TYPES,
  isEnvelope,
  MIGRATIONS,
  migrate,
  parseStored,
  serializeForStorage,
  unwrapAndMigrate,
} from "./dataSchema";

const items = [{ id: "1", x: 10, y: 20 }];

describe("dataSchema", () => {
  describe("migrations", () => {
    it.each(DATA_TYPES)("%s v0 → v1 keeps items unchanged", (type) => {
      expect(MIGRATIONS[type][0](items)).toEqual(items);
    });

    it.each(DATA_TYPES)("%s current version matches the chain", (type) => {
      expect(CURRENT_VERSION[type]).toBe(MIGRATIONS[type].length);
      expect(CURRENT_VERSION[type]).toBeGreaterThanOrEqual(1);
    });

    it("leaves data from a newer version unchanged", () => {
      expect(migrate("shots", items, 99)).toEqual(items);
    });
  });

  describe("createEnvelope", () => {
    it("includes app, type and current version", () => {
      expect(createEnvelope("touches", items)).toEqual({
        app: APP_ID,
        type: "touches",
        version: CURRENT_VERSION.touches,
        data: items,
      });
    });
  });

  describe("isEnvelope", () => {
    it("accepts envelopes and rejects other values", () => {
      expect(isEnvelope(createEnvelope("shots", items))).toBe(true);
      expect(isEnvelope(items)).toBe(false);
      expect(isEnvelope(null)).toBe(false);
      expect(
        isEnvelope({ app: "other", type: "shots", version: 1, data: [] }),
      ).toBe(false);
      expect(
        isEnvelope({ app: APP_ID, type: "nope", version: 1, data: [] }),
      ).toBe(false);
      expect(
        isEnvelope({ app: APP_ID, type: "shots", version: -1, data: [] }),
      ).toBe(false);
    });
  });

  describe("unwrapAndMigrate", () => {
    it("treats a bare array as version 0", () => {
      expect(unwrapAndMigrate(items, "shots")).toEqual({
        ok: true,
        data: items,
      });
    });

    it("unwraps an envelope of the expected type", () => {
      expect(unwrapAndMigrate(createEnvelope("shots", items), "shots")).toEqual(
        { ok: true, data: items },
      );
    });

    it("reports an envelope of another type", () => {
      expect(
        unwrapAndMigrate(createEnvelope("touches", items), "shots"),
      ).toEqual({ ok: false, reason: "wrong-type", actualType: "touches" });
    });

    it("rejects anything else", () => {
      expect(unwrapAndMigrate({ foo: 1 }, "shots")).toEqual({
        ok: false,
        reason: "invalid",
      });
    });
  });

  describe("storage", () => {
    it("loads old bare-array storage with the same content", () => {
      expect(parseStored(JSON.stringify(items), "pass-chains")).toEqual(items);
    });

    it("round-trips data through an envelope", () => {
      const raw = serializeForStorage("shots", items);
      expect(JSON.parse(raw)).toEqual(createEnvelope("shots", items));
      expect(parseStored(raw, "shots")).toEqual(items);
    });

    it("returns null for missing or unusable values", () => {
      expect(parseStored(null, "shots")).toBeNull();
      expect(parseStored('{"foo":1}', "shots")).toBeNull();
      expect(
        parseStored(serializeForStorage("touches", items), "shots"),
      ).toBeNull();
    });

    it("throws on invalid JSON so callers can fall back", () => {
      expect(() => parseStored("not-json{", "shots")).toThrow();
    });
  });
});
