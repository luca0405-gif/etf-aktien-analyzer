"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CHART_CHROME, STATUS_COLORS } from "@/lib/chart-colors";
import { sliceForPeriod, type Period } from "@/lib/period";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PricePoint } from "@/lib/types";

interface CandleShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { open: number; close: number; high: number; low: number };
}

function CandleShape(props: CandleShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? STATUS_COLORS.good : STATUS_COLORS.critical;

  const range = high - low || 1;
  const valueToY = (v: number) => y + ((high - v) / range) * height;

  const bodyTop = valueToY(Math.max(open, close));
  const bodyBottom = valueToY(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5);
  const wickX = x + width / 2;
  const bodyWidth = Math.max(width * 0.6, 3);
  const bodyX = x + (width - bodyWidth) / 2;

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} rx={1} />
    </g>
  );
}

export function CandlestickChart({
  points: history,
  period,
}: {
  points: PricePoint[];
  period: Period;
}) {
  const data = useMemo(() => {
    const points = sliceForPeriod(history, period);
    return points.map((p) => ({
      date: p.date,
      open: p.open,
      close: p.value,
      high: p.high,
      low: p.low,
      range: [p.low, p.high] as [number, number],
    }));
  }, [history, period]);

  return (
    <ResponsiveContainer width="100%" height={320}>
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
          domain={["auto", "auto"]}
          stroke={CHART_CHROME.axis}
          tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          content={({ active, label, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0]?.payload as
              | { open: number; close: number; high: number; low: number }
              | undefined;
            if (!point) return null;
            const isUp = point.close >= point.open;
            return (
              <ChartTooltipCard
                title={formatDate(label as string)}
                rows={[
                  { label: "Eröffnung", value: formatNumber(point.open, 2), color: CHART_CHROME.secondaryText },
                  { label: "Hoch", value: formatNumber(point.high, 2), color: CHART_CHROME.secondaryText },
                  { label: "Tief", value: formatNumber(point.low, 2), color: CHART_CHROME.secondaryText },
                  {
                    label: "Schluss",
                    value: formatNumber(point.close, 2),
                    color: isUp ? STATUS_COLORS.good : STATUS_COLORS.critical,
                  },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="range"
          shape={(props: CandleShapeProps) => <CandleShape {...props} />}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
