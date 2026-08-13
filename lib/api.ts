/**
 * Data-source abstraction layer.
 *
 * Every function here is currently backed by the local mock dataset
 * (lib/mock-data.ts). To go live, swap the implementation body for a call
 * to a real provider — the function signatures and return types are the
 * contract the rest of the app is built against, so no UI code needs to
 * change.
 *
 * Suggested real providers:
 *  - Market data / fundamentals: Financial Modeling Prep, Yahoo Finance
 *    (via RapidAPI or yfinance-compatible proxy), Alpha Vantage.
 *  - News: finanzen.net RSS feeds per ISIN/ticker, or a scraping proxy.
 *  - Sentiment / summarization: an LLM API (e.g. OpenAI GPT-4o, or
 *    Anthropic Claude) run server-side over the raw article text.
 */

import type { Asset, AssetWithNews, NewsItem, PricePoint, Sentiment } from "./types";
import { getLiveSymbol } from "./live-symbols";
import {
  ASSETS,
  getAssetById,
  getAssetWithNews,
  getNewsForAsset,
  searchAssets,
} from "./mock-data";

// --- Search & lookup --------------------------------------------------

export async function apiSearchAssets(query: string): Promise<Asset[]> {
  // TODO(real API): GET https://financialmodelingprep.com/api/v3/search?query=...
  return Promise.resolve(searchAssets(query));
}

export async function apiGetAsset(id: string): Promise<Asset | undefined> {
  // TODO(real API): fetch quote + fundamentals by ticker/ISIN and merge.
  return Promise.resolve(getAssetById(id));
}

export async function apiGetAssetWithNews(
  id: string
): Promise<AssetWithNews | undefined> {
  return Promise.resolve(getAssetWithNews(id));
}

export async function apiListAssets(): Promise<Asset[]> {
  return Promise.resolve(ASSETS);
}

// --- News (finanzen.net) ------------------------------------------------

export interface FinanzenNetFeedOptions {
  isin?: string;
  ticker?: string;
  limit?: number;
}

/**
 * In production this would call a scraper/proxy that fetches
 * https://www.finanzen.net/aktien/<slug>/news or the RSS endpoint for a
 * given ISIN, then normalizes the HTML/RSS into `NewsItem[]` (minus the
 * sentiment fields, which are filled in by `apiAnalyzeSentiment` below).
 */
export async function apiFetchFinanzenNetNews(
  assetId: string,
  _opts: FinanzenNetFeedOptions = {}
): Promise<NewsItem[]> {
  // TODO(real API): scrape/RSS-fetch finanzen.net, then run apiAnalyzeSentiment
  // on each article body before returning.
  return Promise.resolve(getNewsForAsset(assetId));
}

// --- AI sentiment analysis ----------------------------------------------

export interface SentimentAnalysisResult {
  sentiment: Sentiment;
  score: number; // 0-100
  summary: string[]; // bullet points: impact on price
}

/**
 * Swap this for a real LLM call, e.g.:
 *
 *   const res = await openai.chat.completions.create({
 *     model: "gpt-4o",
 *     messages: [
 *       { role: "system", content: SENTIMENT_SYSTEM_PROMPT },
 *       { role: "user", content: articleText },
 *     ],
 *     response_format: { type: "json_object" },
 *   });
 *
 * and parse `{ sentiment, score, summary }` from the response.
 */
export async function apiAnalyzeSentiment(
  articleTitle: string,
  articleText: string
): Promise<SentimentAnalysisResult> {
  // TODO(real API): call an LLM (OpenAI GPT-4o / Claude) with the article
  // and a structured-output schema for { sentiment, score, summary[] }.
  void articleTitle;
  void articleText;
  return Promise.resolve({
    sentiment: "Neutral",
    score: 50,
    summary: ["KI-Zusammenfassung nicht verfügbar (Mock-Modus)."],
  });
}

// --- Forecast scenarios ---------------------------------------------------

/**
 * The bull/base/bear scenario paths are currently generated deterministically
 * from mock drift assumptions (lib/mock-data.ts:genForecast). In production
 * this could call an internal quant model or an LLM-assisted scenario
 * generator seeded with consensus analyst estimates, macro assumptions, and
 * technical indicators.
 */
export async function apiGetForecast(assetId: string) {
  const asset = await apiGetAsset(assetId);
  return asset?.forecast;
}

// --- Live price data (Yahoo Finance, keyless, best-effort) ----------------

export interface LiveHistoryResult {
  symbol: string;
  points: PricePoint[];
}

/**
 * Fetches real daily OHLC history via our own /api/quote proxy route
 * (app/api/quote/[symbol]/route.ts), which in turn calls Yahoo Finance server-side.
 *
 * Returns `null` when the asset has no known live symbol mapped (see
 * lib/live-symbols.ts — all 10 assets are mapped, 5 US tickers plus 5 UCITS
 * ETFs on best-guess exchange suffixes). Throws when a symbol is mapped but
 * the fetch/parse fails, so callers can distinguish "not supported" from
 * "temporarily unavailable" and fall back to mock data accordingly.
 *
 * UNVERIFIED: built and reviewed, but never exercised against a real
 * response — this dev sandbox's network policy blocks finance.yahoo.com
 * outright. Confirm it works once deployed somewhere with normal internet
 * access (see the deployed "Live-Kurs" panel).
 */
export async function apiFetchLiveHistory(assetId: string): Promise<LiveHistoryResult | null> {
  const symbol = getLiveSymbol(assetId);
  if (!symbol) return null;

  const res = await fetch(`/api/quote/${encodeURIComponent(symbol)}`);
  const body = await res.json();

  if (!res.ok) {
    const base = body?.error ?? `Live-Daten nicht verfügbar (Status ${res.status})`;
    const snippet = body?.upstreamSnippet ? ` — Yahoo-Antwort: "${body.upstreamSnippet}"` : "";
    throw new Error(base + snippet);
  }

  const points: PricePoint[] = body.points.map(
    (p: { date: string; open: number; high: number; low: number; close: number }) => ({
      date: p.date,
      value: p.close,
      open: p.open,
      high: p.high,
      low: p.low,
    })
  );

  return { symbol: body.symbol, points };
}
