import { NextResponse } from "next/server";

/**
 * Server-side proxy for Stooq's free, keyless daily-history CSV endpoint.
 * Fetching server-side (instead of directly from the browser) sidesteps
 * CORS entirely, since the browser only ever talks to our own origin.
 *
 * NOTE: this route has not been exercised end-to-end — the sandbox this was
 * built in blocks all outbound requests to external hosts (including
 * stooq.com) at the network-policy level, so there was no way to verify the
 * response shape or confirm which asset symbols actually resolve. Verify
 * against a real request once this is deployed somewhere with normal
 * internet access, and adjust the CSV parsing below if Stooq's format
 * differs from what's assumed here.
 */

export const dynamic = "force-dynamic";

function stooqDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol?.toLowerCase();
  if (!symbol || !/^[a-z0-9.-]+$/.test(symbol)) {
    return NextResponse.json({ error: "Ungültiges Symbol" }, { status: 400 });
  }

  const start = new Date();
  start.setFullYear(start.getFullYear() - 3);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${stooqDate(start)}&i=d`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  } catch (err) {
    return NextResponse.json(
      { error: `Anfrage an Stooq fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Stooq antwortete mit Status ${res.status}` }, { status: 502 });
  }

  const csv = (await res.text()).trim();
  const lines = csv.split("\n");
  const header = lines[0]?.toLowerCase() ?? "";

  if (!header.startsWith("date") || lines.length < 2) {
    return NextResponse.json(
      { error: `Kein Kursverlauf für Symbol "${symbol}" gefunden` },
      { status: 404 }
    );
  }

  const points = lines
    .slice(1)
    .map((line) => {
      const [date, open, high, low, close] = line.split(",");
      return {
        date,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
      };
    })
    .filter(
      (p) =>
        p.date &&
        Number.isFinite(p.open) &&
        Number.isFinite(p.high) &&
        Number.isFinite(p.low) &&
        Number.isFinite(p.close)
    );

  if (points.length === 0) {
    return NextResponse.json({ error: `Keine gültigen Kursdaten für "${symbol}"` }, { status: 404 });
  }

  return NextResponse.json(
    { symbol, points },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
  );
}
