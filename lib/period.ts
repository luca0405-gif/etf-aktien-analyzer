export type Period = "1J" | "3J" | "YTD";

export const PERIODS: Period[] = ["1J", "3J", "YTD"];

/**
 * Date-cutoff based slicing so it works for any point granularity
 * (monthly mock history or daily live history alike) — anchored to the
 * most recent point's date, not "today", so it's stable for historical data.
 */
export function sliceForPeriod<T extends { date: string }>(history: T[], period: Period): T[] {
  if (history.length === 0) return history;
  const lastDate = new Date(history[history.length - 1].date);
  let cutoff: Date;
  if (period === "1J") {
    cutoff = new Date(lastDate);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  } else if (period === "YTD") {
    cutoff = new Date(Date.UTC(lastDate.getUTCFullYear(), 0, 1));
  } else {
    return history;
  }
  const idx = history.findIndex((p) => new Date(p.date).getTime() >= cutoff.getTime());
  return idx === -1 ? history : history.slice(idx);
}
