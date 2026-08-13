import type { Asset } from "./types";

/**
 * Approximate overlap between two ETFs based on their disclosed top-10
 * holdings only (real overlap would require full constituent lists).
 * Returns the summed minimum weight across matching holdings, 0-100.
 */
export function calcOverlap(a: Asset, b: Asset): number {
  if (!a.etf || !b.etf) return 0;
  let overlap = 0;
  for (const holdingA of a.etf.topHoldings) {
    const holdingB = b.etf.topHoldings.find(
      (h) => h.name === holdingA.name || (h.ticker && h.ticker === holdingA.ticker)
    );
    if (holdingB) {
      overlap += Math.min(holdingA.weight, holdingB.weight);
    }
  }
  return Math.round(overlap * 10) / 10;
}
