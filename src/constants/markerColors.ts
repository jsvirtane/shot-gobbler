import { ActionCategory } from "../types/Action";
import { Team } from "../types/common";

/*
 * Marker colours are plain hex values (not Tailwind classes) because markers
 * are inline SVG, which html2canvas draws as a standalone image where CSS
 * classes and variables do not apply.
 *
 * The pairs were checked with simulated protanopia, deuteranopia and
 * tritanopia: blue/orange stay far apart for all three. Every marker gets a
 * white halo, because orange and red are close to the pitch green for
 * red-green colour-blind viewers.
 */

/** One colour per team: blue (home) and orange (away). */
export const TEAM_MARKER_COLORS: Record<Team, string> = {
  home: "#2563eb", // blue-600
  away: "#ea580c", // orange-600
};

/**
 * Touch categories, from the theme's blue / red / yellow families. A dark
 * red and a light yellow keep defensive and duel apart by lightness, which
 * survives red-green colour blindness better than the 500 shades.
 */
export const ACTION_CATEGORY_MARKER_COLORS: Record<ActionCategory, string> = {
  attacking: "#2563eb", // blue-600
  defensive: "#b91c1c", // red-700
  duel: "#fde047", // yellow-300
};

/** Outline drawn around every marker so it stands out on the pitch. */
export const MARKER_HALO_COLOR = "#ffffff";

/** Neutral colour for legend entries that explain shape, not colour. */
export const LEGEND_NEUTRAL_COLOR = "#374151"; // gray-700
