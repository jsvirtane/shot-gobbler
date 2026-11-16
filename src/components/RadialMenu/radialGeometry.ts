/*
 * Pure geometry for the segmented radial menu. Angles are in radians,
 * measured clockwise from the positive x axis (screen coordinates, y down),
 * so -PI/2 points straight up.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Space (px) kept free on each side of the container, e.g. for a floating bar. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Inner radius (px) of the ring; the centre button sits inside it. */
export const INNER_RADIUS = 44;
/** Largest outer radius (px) the ring grows to for many options. */
export const MAX_OUTER_RADIUS = 160;
/** Target width (px) of a segment along its middle arc. */
export const MIN_SEGMENT_ARC = 48;
/** Gap (px) between neighbouring options. */
export const ITEM_GAP = 2;
/** Width (px) of the white backdrop showing around the ring. */
export const RING_RIM = 5;
/** Space (px) kept between the ring and the container edge (room for labels). */
export const EDGE_PAD = 26;
/** Space (px) between the white rim and a section label. */
export const LABEL_OFFSET = 3;
/** Height (px) of a section label pill. */
export const LABEL_HEIGHT = 17;
/** Anchor shifts (px) below this are not worth a leader line. */
export const LEADER_MIN_DISTANCE = 10;

/** Outer radius per spec for the number of options: 118, 128 or 136 px. */
export const baseOuterRadius = (itemCount: number): number =>
  itemCount > 9 ? 136 : itemCount > 6 ? 128 : 118;

/**
 * Angle (radians) of one option. Every option gets an equal slice; sections
 * are told apart by colour and their labels, not by extra space.
 */
export const segmentStep = (itemCount: number): number =>
  (2 * Math.PI) / itemCount;

/**
 * Outer radius for the ring: the spec's base radius, grown (up to
 * MAX_OUTER_RADIUS and what fits the container) until each option is about
 * MIN_SEGMENT_ARC wide along its middle arc.
 */
export const outerRadius = (itemCount: number, bounds?: Size): number => {
  const step = segmentStep(itemCount);
  const needed = (2 * MIN_SEGMENT_ARC) / step - INNER_RADIUS;
  let max = MAX_OUTER_RADIUS;
  if (bounds && bounds.width > 0) {
    max = Math.min(max, Math.floor(bounds.width / 2) - EDGE_PAD);
  }
  const base = baseOuterRadius(itemCount);
  return Math.max(base, Math.min(Math.ceil(needed), max));
};

const clamp = (value: number, min: number, max: number) =>
  // When the container is too small, centre in it rather than overflow one side
  min > max ? (min + max) / 2 : Math.min(Math.max(value, min), max);

/**
 * Moves the ring centre so the ring (plus rim and padding) stays inside the
 * container and clear of the insets. Without bounds the anchor is kept.
 */
export const clampCenter = (
  anchor: Point,
  radius: number,
  bounds: Size | undefined,
  insets: Insets = NO_INSETS,
): Point => {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return { ...anchor };
  const r = radius + RING_RIM + EDGE_PAD;
  return {
    x: clamp(anchor.x, insets.left + r, bounds.width - insets.right - r),
    y: clamp(anchor.y, insets.top + r, bounds.height - insets.bottom - r),
  };
};

export interface SegmentLayout {
  sectionIndex: number;
  itemIndex: number;
  /** Angle at the centre of the option. */
  mid: number;
  /** Start and end of the option's slot, before the gap is taken off. */
  start: number;
  end: number;
}

export interface SectionLayout {
  start: number;
  end: number;
  mid: number;
}

/**
 * Angles for every option, section by section, going clockwise. The first
 * section is centred at the top.
 */
export const segmentAngles = (
  sectionSizes: number[],
): { step: number; segments: SegmentLayout[]; sections: SectionLayout[] } => {
  const sizes = sectionSizes.filter((n) => n > 0);
  const itemCount = sizes.reduce((sum, n) => sum + n, 0);
  if (itemCount === 0) return { step: 0, segments: [], sections: [] };
  const step = segmentStep(itemCount);
  const segments: SegmentLayout[] = [];
  const sections: SectionLayout[] = [];
  // Slot start of the first option, so that the first section is centred at the top
  let a = -Math.PI / 2 - (sizes[0] * step) / 2;
  sectionSizes.forEach((size, originalIndex) => {
    if (size <= 0) return;
    const start = a;
    for (let i = 0; i < size; i++) {
      segments.push({
        sectionIndex: originalIndex,
        itemIndex: i,
        start: a,
        end: a + step,
        mid: a + step / 2,
      });
      a += step;
    }
    sections.push({ start, end: a, mid: (start + a) / 2 });
  });
  return { step, segments, sections };
};

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(2));

export const polar = (center: Point, r: number, angle: number): Point => ({
  x: center.x + r * Math.cos(angle),
  y: center.y + r * Math.sin(angle),
});

/**
 * SVG path of an annular sector from angle a0 to a1 with a gap of `gap` px
 * taken off (half on each side). The gap is the same width at both radii,
 * so neighbouring options are separated by parallel edges.
 */
export const sectorPath = (
  center: Point,
  inner: number,
  outer: number,
  a0: number,
  a1: number,
  gap = ITEM_GAP,
): string => {
  const half = gap / 2;
  const padO = Math.asin(Math.min(1, half / outer));
  const padI = Math.asin(Math.min(1, half / inner));
  const o0 = a0 + padO;
  const o1 = a1 - padO;
  const i0 = a0 + padI;
  const i1 = a1 - padI;
  const large = o1 - o0 > Math.PI ? 1 : 0;
  const largeI = i1 - i0 > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => {
    const pt = polar(center, r, a);
    return `${fmt(pt.x)} ${fmt(pt.y)}`;
  };
  return [
    `M ${p(outer, o0)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${p(outer, o1)}`,
    `L ${p(inner, i1)}`,
    `A ${inner} ${inner} 0 ${largeI} 0 ${p(inner, i0)}`,
    "Z",
  ].join(" ");
};

/** Width (px) of an option along its middle arc, after the gap. */
export const segmentArcWidth = (
  step: number,
  inner: number,
  outer: number,
  gap = ITEM_GAP,
): number => ((inner + outer) / 2) * step - gap;

/** Rough width (px) of an uppercase section label at 10px semibold. */
export const labelWidth = (text: string): number => text.length * 7 + 8;

/**
 * Centre of a section label: just outside the ring at the section's middle
 * angle (far enough that the whole pill clears the rim), then pulled back
 * inside the container if it would stick out.
 */
export const sectionLabelPosition = (
  center: Point,
  outer: number,
  angle: number,
  text: string,
  bounds?: Size,
): Point => {
  const halfW = labelWidth(text) / 2;
  const halfH = LABEL_HEIGHT / 2;
  // Half the pill's extent along the direction of the angle
  const reach =
    Math.abs(Math.cos(angle)) * halfW + Math.abs(Math.sin(angle)) * halfH;
  const pt = polar(center, outer + RING_RIM + LABEL_OFFSET + reach, angle);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return pt;
  const margin = 4;
  return {
    x: clamp(pt.x, halfW + margin, bounds.width - halfW - margin),
    y: clamp(pt.y, halfH + margin, bounds.height - halfH - margin),
  };
};

export interface RadialLayout {
  center: Point;
  inner: number;
  outer: number;
  step: number;
  segments: SegmentLayout[];
  sections: SectionLayout[];
  /** True when the ring was moved away from the anchor (draw a leader line). */
  moved: boolean;
}

/** Full layout of the ring for an anchor point and section sizes. */
export const layoutRadial = ({
  anchor,
  sectionSizes,
  bounds,
  insets = NO_INSETS,
}: {
  anchor: Point;
  sectionSizes: number[];
  bounds?: Size;
  insets?: Insets;
}): RadialLayout => {
  const { step, segments, sections } = segmentAngles(sectionSizes);
  const outer = outerRadius(segments.length, bounds);
  const center = clampCenter(anchor, outer, bounds, insets);
  const moved =
    Math.hypot(center.x - anchor.x, center.y - anchor.y) > LEADER_MIN_DISTANCE;
  return {
    center,
    inner: INNER_RADIUS,
    outer,
    step,
    segments,
    sections,
    moved,
  };
};
