"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CHART_CHROME, STATUS_COLORS } from "@/lib/chart-colors";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import type { Asset } from "@/lib/types";

const HORIZONS = [12, 24, 36] as const;

export function ForecastChart({ asset }: { asset: Asset }) {
  const maxAvailable = asset.forecast.points.length - 1;
  const [horizon, setHorizon] = useState<number>(Math.min(24, maxAvailable));

  const data = useMemo(() => {
    const points = asset.forecast.points.slice(0, horizon + 1);
    return points.map((p) => ({
      ...p,
      band: [p.bear, p.bull] as [number, number],
    }));
  }, [asset, horizon]);

  const lastActual = asset.priceHistory[asset.priceHistory.length - 1].value;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Prognosehorizont: {horizon} Monate — Basis: normierter Kursindex (aktuell ={" "}
          {formatNumber(lastActual, 1)})
        </p>
        <div className="flex gap-1 rounded-md bg-secondary/50 p-1">
          {HORIZONS.filter((h) => h <= maxAvailable).map((h) => (
            <Button
              key={h}
              size="sm"
              variant={horizon === h ? "default" : "ghost"}
              className={cn("h-6 px-2 text-[11px]", horizon !== h && "text-muted-foreground")}
              onClick={() => setHorizon(h)}
            >
              {h}M
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
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
            stroke={CHART_CHROME.axis}
            tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={["auto", "auto"]}
          />
          <ReferenceLine
            x={data[0]?.date}
            stroke={CHART_CHROME.axis}
            strokeDasharray="3 3"
            label={{ value: "Heute", position: "insideTopLeft", fill: CHART_CHROME.mutedText, fontSize: 10 }}
          />
          <Tooltip
            content={({ active, label, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload;
              if (!point) return null;
              return (
                <ChartTooltipCard
                  title={formatDate(label as string)}
                  rows={[
                    { label: "Bull-Case", value: formatNumber(point.bull, 1), color: STATUS_COLORS.good },
                    { label: "Base-Case", value: formatNumber(point.base, 1), color: CHART_CHROME.secondaryText },
                    { label: "Bear-Case", value: formatNumber(point.bear, 1), color: STATUS_COLORS.critical },
                  ]}
                />
              );
            }}
          />
          <Area
            dataKey="band"
            stroke="none"
            fill={STATUS_COLORS.good}
            fillOpacity={0.06}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="bull"
            stroke={STATUS_COLORS.good}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Bull-Case"
          />
          <Line
            type="monotone"
            dataKey="base"
            stroke={CHART_CHROME.secondaryText}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
            name="Base-Case"
          />
          <Line
            type="monotone"
            dataKey="bear"
            stroke={STATUS_COLORS.critical}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Bear-Case"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="grid gap-3 sm:grid-cols-3">
        <ScenarioCard
          label="Bull-Case"
          color={STATUS_COLORS.good}
          value={data[data.length - 1]?.bull}
          drivers={asset.forecast.bullDrivers}
        />
        <ScenarioCard
          label="Base-Case"
          color={CHART_CHROME.secondaryText}
          value={data[data.length - 1]?.base}
          drivers={asset.forecast.baseDrivers}
        />
        <ScenarioCard
          label="Bear-Case"
          color={STATUS_COLORS.critical}
          value={data[data.length - 1]?.bear}
          drivers={asset.forecast.bearDrivers}
        />
      </div>
    </div>
  );
}

function ScenarioCard({
  label,
  color,
  value,
  drivers,
}: {
  label: string;
  color: string;
  value: number | undefined;
  drivers: string[];
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold">{label}</span>
        </div>
        {value !== undefined && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatNumber(value, 1)}
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {drivers.map((d) => (
          <li key={d} className="text-[11px] leading-snug text-muted-foreground">
            • {d}
          </li>
        ))}
      </ul>
    </div>
  );
}
