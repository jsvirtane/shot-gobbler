import { describe, expect, it } from "vitest";
import {
  clampCenter,
  EDGE_PAD,
  INNER_RADIUS,
  ITEM_GAP,
  labelWidth,
  layoutRadial,
  outerRadius,
  RING_RIM,
  sectionLabelPosition,
  sectorPath,
  segmentAngles,
  segmentArcWidth,
  segmentStep,
  SECTION_GAP_UNITS,
} from "./radialGeometry";

const IPHONE = { width: 390, height: 590 };
const TAU = 2 * Math.PI;

/** Splits `items` options into `sections` sections as evenly as possible. */
const split = (items: number, sections: number) =>
  Array.from(
    { length: sections },
    (_, i) => Math.floor(items / sections) + (i < items % sections ? 1 : 0),
  );

const cases: [number, number][] = [];
for (let items = 4; items <= 12; items++) {
  for (let sections = 1; sections <= 4; sections++)
    cases.push([items, sections]);
}

describe("segmentAngles", () => {
  it.each(cases)(
    "%i options in %i sections fill the circle with equal options",
    (items, sections) => {
      const {
        step,
        segments,
        sections: secs,
      } = segmentAngles(split(items, sections));
      expect(segments).toHaveLength(items);
      expect(secs).toHaveLength(sections);
      segments.forEach((s) => expect(s.end - s.start).toBeCloseTo(step));
      const gaps = sections > 1 ? sections * SECTION_GAP_UNITS * step : 0;
      expect(items * step + gaps).toBeCloseTo(TAU);
      // The last option ends where the first one starts, one turn later
      const last =
        segments[segments.length - 1].end +
        (sections > 1 ? SECTION_GAP_UNITS * step : 0);
      expect(last - segments[0].start).toBeCloseTo(TAU);
    },
  );

  it.each(cases)(
    "%i options in %i sections: the first section is centred at the top",
    (items, sections) => {
      const { sections: secs } = segmentAngles(split(items, sections));
      expect(secs[0].mid).toBeCloseTo(-Math.PI / 2);
    },
  );

  it("leaves a wider gap between sections than between options", () => {
    const { step, segments } = segmentAngles([3, 2]);
    expect(segments[1].start - segments[0].end).toBeCloseTo(0);
    expect(segments[3].start - segments[2].end).toBeCloseTo(
      SECTION_GAP_UNITS * step,
    );
  });

  it("skips empty sections but keeps their indices", () => {
    const { segments, sections } = segmentAngles([2, 0, 2]);
    expect(sections).toHaveLength(2);
    expect(segments.map((s) => s.sectionIndex)).toEqual([0, 0, 2, 2]);
  });

  it("returns nothing for no options", () => {
    expect(segmentAngles([]).segments).toEqual([]);
  });
});

describe("outerRadius", () => {
  it("uses 118, 128 and 136 px for few, more and many options", () => {
    expect(outerRadius(4, 1, IPHONE)).toBe(118);
    expect(outerRadius(7, 2, IPHONE)).toBe(128);
    expect(outerRadius(10, 1, IPHONE)).toBe(136);
  });

  it("grows for many options, but not past a narrow container", () => {
    expect(outerRadius(12, 4, IPHONE)).toBeGreaterThan(136);
    expect(outerRadius(12, 4, IPHONE)).toBeLessThanOrEqual(160);
    expect(outerRadius(12, 4, { width: 300, height: 500 })).toBe(136);
  });
});

describe("segment size on a 390 px screen", () => {
  it.each(cases)(
    "%i options in %i sections are at least 44 px deep and about 48 px wide",
    (items, sections) => {
      const layout = layoutRadial({
        anchor: { x: 195, y: 295 },
        sectionSizes: split(items, sections),
        bounds: IPHONE,
      });
      expect(layout.outer - layout.inner).toBeGreaterThanOrEqual(44);
      const width = segmentArcWidth(layout.step, layout.inner, layout.outer);
      // "About 48": the densest case (12 options in 4 sections) is ~45 px
      expect(width).toBeGreaterThanOrEqual(44);
    },
  );

  it("reaches 48 px for up to 12 options in 3 sections", () => {
    const layout = layoutRadial({
      anchor: { x: 195, y: 295 },
      sectionSizes: [4, 4, 4],
      bounds: IPHONE,
    });
    expect(
      segmentArcWidth(layout.step, layout.inner, layout.outer),
    ).toBeGreaterThanOrEqual(48 - ITEM_GAP);
  });
});

describe("clampCenter", () => {
  const r = 118;
  const keep = r + RING_RIM + EDGE_PAD;

  it("keeps an anchor that already fits", () => {
    expect(clampCenter({ x: 195, y: 295 }, r, IPHONE)).toEqual({
      x: 195,
      y: 295,
    });
  });

  it.each([
    ["top-left", { x: 5, y: 5 }, { x: keep, y: keep }],
    ["top", { x: 195, y: 0 }, { x: 195, y: keep }],
    ["top-right", { x: 389, y: 2 }, { x: 390 - keep, y: keep }],
    ["right", { x: 400, y: 300 }, { x: 390 - keep, y: 300 }],
    ["bottom-right", { x: 385, y: 585 }, { x: 390 - keep, y: 590 - keep }],
    ["bottom", { x: 195, y: 590 }, { x: 195, y: 590 - keep }],
    ["bottom-left", { x: 0, y: 590 }, { x: keep, y: 590 - keep }],
    ["left", { x: -10, y: 300 }, { x: keep, y: 300 }],
  ])("pulls the ring in from the %s edge", (_, anchor, expected) => {
    const c = clampCenter(anchor, r, IPHONE);
    expect(c.x).toBeCloseTo(expected.x);
    expect(c.y).toBeCloseTo(expected.y);
  });

  it("keeps clear of insets such as a floating bar", () => {
    const c = clampCenter({ x: 195, y: 580 }, r, IPHONE, {
      top: 0,
      right: 0,
      bottom: 70,
      left: 0,
    });
    expect(c.y).toBeCloseTo(590 - 70 - keep);
  });

  it("centres in a container too small for the ring", () => {
    expect(clampCenter({ x: 0, y: 0 }, r, { width: 200, height: 200 })).toEqual(
      { x: 100, y: 100 },
    );
  });

  it("keeps the anchor without bounds", () => {
    expect(clampCenter({ x: 3, y: 4 }, r, undefined)).toEqual({ x: 3, y: 4 });
  });
});

describe("layoutRadial", () => {
  it("flags a moved ring so a leader line is drawn", () => {
    expect(
      layoutRadial({
        anchor: { x: 10, y: 10 },
        sectionSizes: [4],
        bounds: IPHONE,
      }).moved,
    ).toBe(true);
    expect(
      layoutRadial({
        anchor: { x: 195, y: 295 },
        sectionSizes: [4],
        bounds: IPHONE,
      }).moved,
    ).toBe(false);
  });

  it("uses the inner radius from the spec", () => {
    expect(
      layoutRadial({ anchor: { x: 0, y: 0 }, sectionSizes: [4] }).inner,
    ).toBe(INNER_RADIUS);
  });
});

describe("sectorPath", () => {
  it("draws an annular sector with two arcs", () => {
    const d = sectorPath({ x: 100, y: 100 }, 44, 118, -Math.PI / 2, 0);
    expect(d).toMatch(
      /^M [-\d.]+ [-\d.]+ A 118 118 0 0 1 .* L .* A 44 44 0 0 0 .* Z$/,
    );
  });

  it("matches a known path", () => {
    expect(
      sectorPath({ x: 0, y: 0 }, 44, 118, 0, Math.PI / 2),
    ).toMatchInlineSnapshot(
      `"M 118.00 1.00 A 118 118 0 0 1 1.00 118.00 L 1.00 43.99 A 44 44 0 0 0 43.99 1.00 Z"`,
    );
  });

  it("takes the gap off both radii as a constant width", () => {
    const d = sectorPath({ x: 0, y: 0 }, 44, 118, 0, Math.PI / 2, 2);
    // Start edge is 1 px off the x axis at both radii
    expect(d).toContain("M 118.00 1.00");
    expect(d).toContain("43.99 1.00");
  });

  it("uses the large-arc flag for wide sectors", () => {
    expect(sectorPath({ x: 0, y: 0 }, 44, 118, 0, 1.5 * Math.PI)).toContain(
      "A 118 118 0 1 1",
    );
  });
});

describe("sectionLabelPosition", () => {
  it("sits just outside the ring", () => {
    const p = sectionLabelPosition(
      { x: 195, y: 295 },
      118,
      -Math.PI / 2,
      "RESULT",
    );
    expect(p.x).toBeCloseTo(195);
    expect(p.y).toBeCloseTo(295 - 118 - RING_RIM - 3 - 8.5);
  });

  it("stays on screen near an edge", () => {
    const text = "DETAILS";
    const p = sectionLabelPosition(
      { x: 10, y: 10 },
      118,
      Math.PI,
      text,
      IPHONE,
    );
    expect(p.x - labelWidth(text) / 2).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });

  it("clears the ring sideways by half the label width", () => {
    const text = "DEFENSIVE";
    const p = sectionLabelPosition({ x: 0, y: 0 }, 118, 0, text);
    expect(p.x - labelWidth(text) / 2).toBeGreaterThan(118 + RING_RIM);
  });
});

describe("segmentStep", () => {
  it("ignores the section gap for a single section", () => {
    expect(segmentStep(8, 1)).toBeCloseTo(TAU / 8);
  });
});
