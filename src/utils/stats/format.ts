/** Shown in place of a value that cannot be computed (e.g. 0 / 0). */
export const NO_VALUE = "–";

/** part / whole, or null when there is nothing to divide by. */
export const ratio = (part: number, whole: number): number | null =>
  whole > 0 ? part / whole : null;

/** A ratio as a whole percentage, e.g. "38%", or "–". */
export const formatPercent = (value: number | null): string =>
  value === null ? NO_VALUE : `${Math.round(value * 100)}%`;

/** A number with fixed decimals, or "–". */
export const formatDecimal = (value: number | null, digits = 2): string =>
  value === null ? NO_VALUE : value.toFixed(digits);

/** A difference with its sign, e.g. "+0.42" or "−0.17", or "–". */
export const formatSigned = (value: number | null, digits = 2): string => {
  if (value === null) return NO_VALUE;
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return (0).toFixed(digits);
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(digits)}`;
};

/** "1 goal" / "3 goals". */
export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
