import { CHART_CHROME } from "@/lib/chart-colors";

export interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

export function ChartTooltipCard({
  title,
  rows,
}: {
  title?: string;
  rows: TooltipRow[];
}) {
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-lg"
      style={{
        background: CHART_CHROME.surface,
        borderColor: CHART_CHROME.axis,
        color: CHART_CHROME.primaryText,
      }}
    >
      {title && (
        <div className="mb-1.5 font-medium" style={{ color: CHART_CHROME.secondaryText }}>
          {title}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: r.color }}
            />
            <span className="flex-1" style={{ color: CHART_CHROME.secondaryText }}>
              {r.label}
            </span>
            <span className="font-mono tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
