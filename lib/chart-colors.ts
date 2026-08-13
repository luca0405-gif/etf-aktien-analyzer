// Validated dark-surface categorical palette (see dataviz skill, palette.md).
// Assigned in fixed order — never cycled/reassigned when the series count changes.
export const CATEGORICAL_PALETTE = [
  "#3987e5", // 1 blue
  "#d95926", // 2 orange
  "#199e70", // 3 aqua
  "#c98500", // 4 yellow
  "#d55181", // 5 magenta
  "#9085e9", // 6 violet
  "#e66767", // 7 red
] as const;

export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const CHART_CHROME = {
  surface: "#1a1a19",
  gridline: "#2c2c2a",
  axis: "#383835",
  mutedText: "#898781",
  secondaryText: "#c3c2b7",
  primaryText: "#ffffff",
} as const;

export function colorForIndex(i: number): string {
  return CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length];
}

/** Stable color per unique label, assigned in first-seen order. */
export function makeLabelColorScale() {
  const map = new Map<string, string>();
  return (label: string) => {
    if (!map.has(label)) {
      map.set(label, colorForIndex(map.size));
    }
    return map.get(label)!;
  };
}
