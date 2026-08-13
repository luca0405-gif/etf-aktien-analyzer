"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { CATEGORICAL_PALETTE, CHART_CHROME } from "@/lib/chart-colors";
import { PERIODS, sliceForPeriod, type Period } from "@/lib/period";
import { formatDate, formatPercent } from "@/lib/utils";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "line" | "candles";

export function PerformanceChart({ assets }: { assets: Asset[] }) {
  const [period, setPeriod] = useState<Period>("3J");
  const [view, setView] = useState<ViewMode>("line");
  const [candleAssetId, setCandleAssetId] = useState<string | undefined>(assets[0]?.id);

  useEffect(() => {
    if (!assets.find((a) => a.id === candleAssetId)) {
      setCandleAssetId(assets[0]?.id);
    }
  }, [assets, candleAssetId]);

  const data = useMemo(() => {
    if (assets.length === 0) return [];
    const sliced = assets.map((a) => sliceForPeriod(a.priceHistory, period));
    const len = Math.min(...sliced.map((s) => s.length));
    const rows: Record<string, number | string>[] = [];
    for (let i = 0; i < len; i++) {
      const row: Record<string, number | string> = { date: sliced[0][i].date };
      assets.forEach((a, idx) => {
        const series = sliced[idx];
        const start = series[series.length - len].value;
        const point = series[series.length - len + i];
        row[a.id] = Math.round((point.value / start - 1) * 10000) / 100;
      });
      rows.push(row);
    }
    return rows;
  }, [assets, period]);

  const candleAsset = assets.find((a) => a.id === candleAssetId) ?? assets[0];

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Performance-Verlauf</CardTitle>
          <CardDescription>
            {view === "line" ? "Normiert auf % seit Startpunkt" : "Kerzenchart (OHLC), normierter Index"}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          {view === "candles" && assets.length > 1 && (
            <Select value={candleAsset?.id} onValueChange={setCandleAssetId}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.ticker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Wähle Assets aus, um den Kursverlauf zu vergleichen.
          </div>
        ) : view === "candles" ? (
          candleAsset && <CandlestickChart points={candleAsset.priceHistory} period={period} />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
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
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
                stroke={CHART_CHROME.axis}
                tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) return null;
                  const rows = payload
                    .slice()
                    .sort((a, b) => (b.value as number) - (a.value as number))
                    .map((p) => {
                      const asset = assets.find((a) => a.id === p.dataKey);
                      return {
                        label: asset?.ticker ?? String(p.dataKey),
                        value: formatPercent(p.value as number),
                        color: p.color as string,
                      };
                    });
                  return <ChartTooltipCard title={formatDate(label)} rows={rows} />;
                }}
              />
              <Legend
                formatter={(value) => {
                  const asset = assets.find((a) => a.id === value);
                  return (
                    <span style={{ color: CHART_CHROME.secondaryText, fontSize: 12 }}>
                      {asset?.ticker ?? value}
                    </span>
                  );
                }}
              />
              {assets.map((a, i) => (
                <Line
                  key={a.id}
                  type="monotone"
                  dataKey={a.id}
                  name={a.id}
                  stroke={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
