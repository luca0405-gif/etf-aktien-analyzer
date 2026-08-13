/**
 * Maps our internal asset IDs to Stooq (stooq.com) ticker symbols for the
 * keyless live-data path (see app/api/quote/[symbol]/route.ts).
 *
 * Only the 5 individual stocks are mapped: Stooq's `<ticker>.us` convention
 * for US-listed equities is well-documented and stable. The 5 UCITS ETFs are
 * deliberately left unmapped — their listing/symbol format on Stooq varies
 * by exchange and could not be verified from this environment (the sandbox's
 * network policy blocks outbound requests to stooq.com, so nothing here has
 * been tested end-to-end). Extend this map once real access confirms the
 * right ETF symbols.
 */
export const LIVE_SYMBOLS: Record<string, string> = {
  "stock-apple": "aapl.us",
  "stock-nvidia": "nvda.us",
  "stock-microsoft": "msft.us",
  "stock-amazon": "amzn.us",
  "stock-alphabet": "googl.us",
};

export function getLiveSymbol(assetId: string): string | undefined {
  return LIVE_SYMBOLS[assetId];
}
