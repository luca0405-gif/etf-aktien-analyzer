"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { aggregateAllocations, OTHER_LABEL } from "@/lib/allocation";
import { CATEGORICAL_PALETTE, CHART_CHROME } from "@/lib/chart-colors";
import { formatPercent } from "@/lib/utils";
import type { Asset } from "@/lib/types";

const OTHER_COLOR = "#6b6a65";

function colorForLabel(label: string, labels: string[]): string {
  if (label === OTHER_LABEL) return OTHER_COLOR;
  return CATEGORICAL_PALETTE[labels.indexOf(label) % CATEGORICAL_PALETTE.length];
}

export function AllocationChart({ assets }: { assets: Asset[] }) {
  const [axis, setAxis] = useState<"sector" | "region">("sector");

  const { labels, rows } = useMemo(() => aggregateAllocations(assets, axis), [assets, axis]);

  const data = rows.map((r) => ({ ticker: r.ticker, assetId: r.assetId, ...r.values }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Branchen- &amp; Regionenverteilung</CardTitle>
          <CardDescription>Gewichtung in % je Asset</CardDescription>
        </div>
        <Tabs value={axis} onValueChange={(v) => setAxis(v as "sector" | "region")}>
          <TabsList>
            <TabsTrigger value="sector">Sektor</TabsTrigger>
            <TabsTrigger value="region">Region</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Wähle Assets aus, um die Verteilung zu vergleichen.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={CHART_CHROME.gridline} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke={CHART_CHROME.axis}
                  tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="ticker"
                  stroke={CHART_CHROME.axis}
                  tick={{ fill: CHART_CHROME.secondaryText, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={({ active, label, payload }) => {
                    if (!active || !payload?.length) return null;
                    const rows = payload
                      .filter((p) => (p.value as number) > 0)
                      .sort((a, b) => (b.value as number) - (a.value as number))
                      .map((p) => ({
                        label: String(p.dataKey),
                        value: formatPercent(p.value as number, 1),
                        color: p.color as string,
                      }));
                    return <ChartTooltipCard title={label as string} rows={rows} />;
                  }}
                />
                {labels.map((label) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    stackId="alloc"
                    fill={colorForLabel(label, labels)}
                    radius={0}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {labels.map((label) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: colorForLabel(label, labels) }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
