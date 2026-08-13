"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RadioTower } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { CHART_CHROME, STATUS_COLORS } from "@/lib/chart-colors";
import { apiFetchLiveHistory } from "@/lib/api";
import { LIVE_SYMBOLS } from "@/lib/live-symbols";
import { getAssetById } from "@/lib/mock-data";
import { PERIODS, sliceForPeriod, type Period } from "@/lib/period";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import type { PricePoint } from "@/lib/types";

type ViewMode = "line" | "candles";
type Status = "idle" | "loading" | "success" | "error";

const LIVE_ASSET_IDS = Object.keys(LIVE_SYMBOLS);

export function LivePricePanel() {
  const [assetId, setAssetId] = useState(LIVE_ASSET_IDS[0]);
  const [view, setView] = useState<ViewMode>("candles");
  const [period, setPeriod] = useState<Period>("1J");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<PricePoint[]>([]);

  const asset = getAssetById(assetId);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError(null);
    apiFetchLiveHistory(assetId)
      .then((result) => {
        if (!active) return;
        if (!result) {
          setStatus("error");
          setError("Für dieses Asset ist keine Live-Zuordnung hinterlegt.");
          return;
        }
        setPoints(result.points);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unbekannter Fehler beim Laden der Live-Daten.");
      });
    return () => {
      active = false;
    };
  }, [assetId]);

  const fallbackPoints = asset?.priceHistory ?? [];
  const displayPoints = status === "success" ? points : fallbackPoints;
  const lineData = sliceForPeriod(displayPoints, period).map((p) => ({
    date: p.date,
    close: p.value,
  }));

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RadioTower className="h-4 w-4 text-primary" />
            Live-Kurs
          </CardTitle>
          <CardDescription>
            Echte Tageskurse (Quelle: Yahoo Finance) — experimentell
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={assetId} onValueChange={setAssetId}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIVE_ASSET_IDS.map((id) => {
                const a = getAssetById(id);
                return a ? (
                  <SelectItem key={id} value={id}>
                    {a.ticker}
                  </SelectItem>
                ) : null;
              })}
            </SelectContent>
          </Select>
          <div className="flex gap-1 rounded-md bg-secondary/50 p-1">
            {(["line", "candles"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={view === v ? "default" : "ghost"}
                className={cn("h-6 px-2 text-[11px]", view !== v && "text-muted-foreground")}
                onClick={() => setView(v)}
              >
                {v === "line" ? "Linie" : "Kerzen"}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 rounded-md bg-secondary/50 p-1">
            {PERIODS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "ghost"}
                className={cn("h-6 px-2 text-[11px]", period !== p && "text-muted-foreground")}
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-2">
          {status === "success" && <Badge variant="bullish">Live · Yahoo Finance</Badge>}
          {status === "loading" && <Badge variant="neutral">Lädt…</Badge>}
          {status === "error" && <Badge variant="bearish">Mock-Fallback</Badge>}
          {asset && (
            <span className="text-xs text-muted-foreground">
              {asset.name} ({asset.ticker})
            </span>
          )}
        </div>

        {status === "error" && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-bear/30 bg-bear/10 p-2.5 text-xs text-bear">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Live-Daten aktuell nicht abrufbar ({error}). Zeige stattdessen Mock-Daten. Symbol-
              Zuordnung ggf. in lib/live-symbols.ts anpassen, falls das Problem an einem falschen
              Ticker liegt.
            </span>
          </div>
        )}

        {status === "loading" ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Lade Live-Kursdaten…
          </div>
        ) : view === "candles" ? (
          <CandlestickChart points={displayPoints} period={period} />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d)}
                stroke={CHART_CHROME.axis}
                tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke={CHART_CHROME.axis}
                tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <ChartTooltipCard
                      title={formatDate(label as string)}
                      rows={[
                        {
                          label: asset?.ticker ?? "Kurs",
                          value: `${formatNumber(payload[0].value as number, 2)} ${asset?.currency ?? ""}`,
                          color: STATUS_COLORS.good,
                        },
                      ]}
                    />
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke={STATUS_COLORS.good}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
