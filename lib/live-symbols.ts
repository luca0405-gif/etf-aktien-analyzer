/**
 * Maps our internal asset IDs to Yahoo Finance ticker symbols for the
 * keyless live-data path (see app/api/quote/[symbol]/route.ts).
 *
 * Switched from Stooq to Yahoo Finance's chart JSON endpoint: Stooq's CSV
 * endpoint returned a JS-challenge bot-check page when called from Vercel's
 * serverless IPs (no way to solve that server-side), so it was a dead end
 * regardless of symbol correctness.
 *
 * US stocks use plain tickers (AAPL, NVDA, …). The 5 UCITS ETFs use Yahoo's
 * exchange-suffix convention: `.DE` for Xetra-listed, `.L` for London-listed.
 * These mappings are a best guess based on each fund's primary listing —
 * verify against the live "Live-Kurs" panel and adjust here if a symbol
 * doesn't resolve (the API route surfaces Yahoo's raw error/response to
 * make that fast to diagnose).
 */
export const LIVE_SYMBOLS: Record<string, string> = {
  "stock-apple": "AAPL",
  "stock-nvidia": "NVDA",
  "stock-microsoft": "MSFT",
  "stock-amazon": "AMZN",
  "stock-alphabet": "GOOGL",
  "etf-ishares-msci-world": "EUNL.DE",
  "etf-vanguard-ftse-all-world": "VWCE.DE",
  "etf-ishares-core-sp500": "CSPX.L",
  "etf-xtrackers-msci-em": "XMME.DE",
  "etf-ishares-stoxx-europe-600": "EXSA.DE",
};

export function getLiveSymbol(assetId: string): string | undefined {
  return LIVE_SYMBOLS[assetId];
}
