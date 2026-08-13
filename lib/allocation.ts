import type { Asset, AllocationSlice } from "./types";

const OTHER_LABEL = "Sonstige";
const MAX_NAMED_CATEGORIES = 6;

export interface AllocationRow {
  assetId: string;
  ticker: string;
  values: Record<string, number>;
}

export interface AggregatedAllocation {
  labels: string[]; // named categories, ranked; "Sonstige" appended last if present
  rows: AllocationRow[];
}

function getSlices(asset: Asset, axis: "sector" | "region"): AllocationSlice[] {
  return axis === "sector" ? asset.sectorAllocation : asset.regionAllocation;
}

export function aggregateAllocations(
  assets: Asset[],
  axis: "sector" | "region"
): AggregatedAllocation {
  const totals = new Map<string, number>();
  for (const asset of assets) {
    for (const slice of getSlices(asset, axis)) {
      totals.set(slice.label, (totals.get(slice.label) ?? 0) + slice.weight);
    }
  }

  const ranked = Array.from(totals.entries())
    .filter(([label]) => label !== OTHER_LABEL)
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);

  const namedLabels = ranked.slice(0, MAX_NAMED_CATEGORIES);
  const hasOverflow = ranked.length > MAX_NAMED_CATEGORIES || totals.has(OTHER_LABEL);

  const rows: AllocationRow[] = assets.map((asset) => {
    const values: Record<string, number> = {};
    let otherSum = 0;
    for (const slice of getSlices(asset, axis)) {
      if (namedLabels.includes(slice.label)) {
        values[slice.label] = (values[slice.label] ?? 0) + slice.weight;
      } else {
        otherSum += slice.weight;
      }
    }
    if (hasOverflow) values[OTHER_LABEL] = Math.round(otherSum * 10) / 10;
    return { assetId: asset.id, ticker: asset.ticker, values };
  });

  return {
    labels: hasOverflow ? [...namedLabels, OTHER_LABEL] : namedLabels,
    rows,
  };
}

export { OTHER_LABEL };
