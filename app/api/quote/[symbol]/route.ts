import { NextResponse } from "next/server";

/**
 * Server-side proxy for Yahoo Finance's free, keyless chart JSON endpoint.
 * Fetching server-side (instead of directly from the browser) sidesteps
 * CORS entirely, since the browser only ever talks to our own origin.
 *
 * Previously used Stooq's CSV endpoint, but that returned a JS-challenge
 * bot-check page when called from Vercel's serverless IPs — no way to solve
 * that server-side. Yahoo's `/v8/finance/chart` JSON endpoint is the
 * long-standing de-facto keyless option (same one the `yfinance` Python
 * library uses) and is generally tolerant of server-side requests.
 *
 * NOTE: still not exercised from the environment this was written in — its
 * network policy blocks outbound requests to finance.yahoo.com too. Verify
 * against the deployed "Live-Kurs" panel; the error response below includes
 * a snippet of Yahoo's raw reply to make that fast to diagnose if it fails.
 */

export const dynamic = "force-dynamic";

interface YahooChartResult {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
    }>;
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol?.toUpperCase();
  if (!symbol || !/^[A-Z0-9.-]+$/.test(symbol)) {
    return NextResponse.json({ error: "Ungültiges Symbol" }, { status: 400 });
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=3y&interval=1d`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json,text/plain,*/*",
      },
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Anfrage an Yahoo Finance fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const rawText = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { error: `Yahoo Finance antwortete mit Status ${res.status}`, upstreamSnippet: rawText.slice(0, 300) },
      { status: 502 }
    );
  }

  let json: { chart?: { result?: YahooChartResult[]; error?: { description?: string } | null } };
  try {
    json = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Antwort von Yahoo Finance war kein gültiges JSON", upstreamSnippet: rawText.slice(0, 300) },
      { status: 502 }
    );
  }

  const chartError = json.chart?.error;
  if (chartError) {
    return NextResponse.json(
      { error: chartError.description ?? `Symbol "${symbol}" nicht gefunden` },
      { status: 404 }
    );
  }

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!timestamps || !quote) {
    return NextResponse.json(
      { error: `Kein Kursverlauf für Symbol "${symbol}" gefunden`, upstreamSnippet: rawText.slice(0, 300) },
      { status: 404 }
    );
  }

  const points = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      close: quote.close?.[i],
    }))
    .filter(
      (p): p is { date: string; open: number; high: number; low: number; close: number } =>
        typeof p.open === "number" &&
        typeof p.high === "number" &&
        typeof p.low === "number" &&
        typeof p.close === "number"
    );

  if (points.length === 0) {
    return NextResponse.json({ error: `Keine gültigen Kursdaten für "${symbol}"` }, { status: 404 });
  }

  return NextResponse.json(
    { symbol, points },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
  );
}
