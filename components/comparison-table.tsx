"use client";

import { Fragment, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AssetAvatar } from "@/components/asset-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDashboardStore, type AssetTypeFilter } from "@/lib/store";
import { getAssetById } from "@/lib/mock-data";
import { calcOverlap } from "@/lib/overlap";
import { cn, formatCompact, formatNumber, formatPercent } from "@/lib/utils";
import type { Asset } from "@/lib/types";

interface Row {
  section: string;
  label: string;
  onlyFor?: "ETF" | "Stock";
  get: (a: Asset) => string;
  raw: (a: Asset) => number | string | undefined;
}

function pctCell(a: Asset, v: number | undefined) {
  if (v === undefined) return "–";
  return formatPercent(v);
}

const ROWS: Row[] = [
  { section: "Allgemein", label: "Typ", get: (a) => (a.type === "ETF" ? "ETF" : "Aktie"), raw: (a) => a.type },
  { section: "Allgemein", label: "ISIN", get: (a) => a.isin, raw: (a) => a.isin },
  { section: "Allgemein", label: "Ticker", get: (a) => a.ticker, raw: (a) => a.ticker },
  { section: "Allgemein", label: "Währung", get: (a) => a.currency, raw: (a) => a.currency },
  { section: "Allgemein", label: "Performance 1J", get: (a) => pctCell(a, a.performance.y1), raw: (a) => a.performance.y1 },
  { section: "Allgemein", label: "Performance 3J (CAGR)", get: (a) => pctCell(a, a.performance.y3), raw: (a) => a.performance.y3 },
  { section: "Allgemein", label: "Performance 5J (CAGR)", get: (a) => pctCell(a, a.performance.y5), raw: (a) => a.performance.y5 },
  { section: "Allgemein", label: "Performance YTD", get: (a) => pctCell(a, a.performance.ytd), raw: (a) => a.performance.ytd },
  { section: "Allgemein", label: "Volatilität (p.a.)", get: (a) => `${formatNumber(a.performance.volatility, 1)}%`, raw: (a) => a.performance.volatility },
  { section: "Allgemein", label: "Sharpe Ratio", get: (a) => formatNumber(a.performance.sharpeRatio, 2), raw: (a) => a.performance.sharpeRatio },

  { section: "ETF-Kennzahlen", label: "TER", onlyFor: "ETF", get: (a) => (a.etf ? `${formatNumber(a.etf.ter, 2)}%` : "–"), raw: (a) => a.etf?.ter },
  { section: "ETF-Kennzahlen", label: "Fondsvolumen (AUM)", onlyFor: "ETF", get: (a) => (a.etf ? `€${formatCompact(a.etf.aum)}` : "–"), raw: (a) => a.etf?.aum },
  { section: "ETF-Kennzahlen", label: "Replikationsmethode", onlyFor: "ETF", get: (a) => a.etf?.replicationMethod ?? "–", raw: (a) => a.etf?.replicationMethod },
  { section: "ETF-Kennzahlen", label: "Ertragsverwendung", onlyFor: "ETF", get: (a) => a.etf ? `${a.etf.distributionPolicy}${a.etf.distributionFrequency ? ` (${a.etf.distributionFrequency})` : ""}` : "–", raw: (a) => a.etf?.distributionPolicy },
  { section: "ETF-Kennzahlen", label: "Fondsdomizil", onlyFor: "ETF", get: (a) => a.etf?.fundDomicile ?? "–", raw: (a) => a.etf?.fundDomicile },
  { section: "ETF-Kennzahlen", label: "Auflagedatum", onlyFor: "ETF", get: (a) => a.etf?.inceptionDate ?? "–", raw: (a) => a.etf?.inceptionDate },

  { section: "Aktien-Kennzahlen", label: "KGV (P/E)", onlyFor: "Stock", get: (a) => (a.stock ? formatNumber(a.stock.pe, 1) : "–"), raw: (a) => a.stock?.pe },
  { section: "Aktien-Kennzahlen", label: "KBV (P/B)", onlyFor: "Stock", get: (a) => (a.stock ? formatNumber(a.stock.pb, 1) : "–"), raw: (a) => a.stock?.pb },
  { section: "Aktien-Kennzahlen", label: "Dividendenrendite", onlyFor: "Stock", get: (a) => (a.stock ? `${formatNumber(a.stock.dividendYield, 2)}%` : "–"), raw: (a) => a.stock?.dividendYield },
  { section: "Aktien-Kennzahlen", label: "Umsatzwachstum (YoY)", onlyFor: "Stock", get: (a) => pctCell(a, a.stock?.revenueGrowthYoY), raw: (a) => a.stock?.revenueGrowthYoY },
  { section: "Aktien-Kennzahlen", label: "Umsatzwachstum (3J CAGR)", onlyFor: "Stock", get: (a) => pctCell(a, a.stock?.revenueGrowth3yCagr), raw: (a) => a.stock?.revenueGrowth3yCagr },
  { section: "Aktien-Kennzahlen", label: "Gewinnwachstum (YoY)", onlyFor: "Stock", get: (a) => pctCell(a, a.stock?.profitGrowthYoY), raw: (a) => a.stock?.profitGrowthYoY },
  { section: "Aktien-Kennzahlen", label: "Gewinnwachstum (3J CAGR)", onlyFor: "Stock", get: (a) => pctCell(a, a.stock?.profitGrowth3yCagr), raw: (a) => a.stock?.profitGrowth3yCagr },
  { section: "Aktien-Kennzahlen", label: "Debt/Equity", onlyFor: "Stock", get: (a) => (a.stock ? formatNumber(a.stock.debtToEquity, 2) : "–"), raw: (a) => a.stock?.debtToEquity },
  { section: "Aktien-Kennzahlen", label: "Free-Cashflow-Marge", onlyFor: "Stock", get: (a) => (a.stock ? `${formatNumber(a.stock.fcfMargin, 1)}%` : "–"), raw: (a) => a.stock?.fcfMargin },
  { section: "Aktien-Kennzahlen", label: "Marktkapitalisierung", onlyFor: "Stock", get: (a) => (a.stock ? `€${formatCompact(a.stock.marketCap)}` : "–"), raw: (a) => a.stock?.marketCap },
];

export function ComparisonTable() {
  const {
    selectedAssetIds,
    assetTypeFilter,
    setAssetTypeFilter,
    showOnlyDifferences,
    toggleShowOnlyDifferences,
    openAssetModal,
  } = useDashboardStore();

  const allSelected = selectedAssetIds
    .map((id) => getAssetById(id))
    .filter((a): a is Asset => Boolean(a));

  const assets = useMemo(
    () =>
      assetTypeFilter === "all"
        ? allSelected
        : allSelected.filter((a) => a.type === assetTypeFilter),
    [allSelected, assetTypeFilter]
  );

  const hasEtf = assets.some((a) => a.type === "ETF");
  const hasStock = assets.some((a) => a.type === "Stock");
  const etfAssets = assets.filter((a) => a.type === "ETF");

  const visibleRows = useMemo(() => {
    return ROWS.filter((row) => {
      if (row.onlyFor === "ETF" && !hasEtf) return false;
      if (row.onlyFor === "Stock" && !hasStock) return false;
      if (!showOnlyDifferences) return true;
      const values = assets.map((a) => row.get(a));
      return new Set(values).size > 1;
    });
  }, [assets, hasEtf, hasStock, showOnlyDifferences]);

  const sections = Array.from(new Set(visibleRows.map((r) => r.section)));

  if (allSelected.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Noch keine Assets ausgewählt. Nutze die Suche oben, um ETFs oder Aktien zum Vergleich hinzuzufügen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b border-border pb-4">
        <div>
          <CardTitle>Vergleichstabelle</CardTitle>
          <CardDescription>
            {assets.length} von {allSelected.length} ausgewählten Assets angezeigt
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={showOnlyDifferences} onCheckedChange={toggleShowOnlyDifferences} />
            Nur Unterschiede
          </label>
          <Select
            value={assetTypeFilter}
            onValueChange={(v) => setAssetTypeFilter(v as AssetTypeFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="ETF">Nur ETFs</SelectItem>
              <SelectItem value="Stock">Nur Aktien</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {assets.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Keine ausgewählten Assets entsprechen dem aktuellen Filter.
          </p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="sticky left-0 z-10 bg-secondary/20 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Kennzahl
                </th>
                {assets.map((a) => (
                  <th key={a.id} className="min-w-[160px] px-4 py-3 text-left">
                    <button
                      onClick={() => openAssetModal(a.id)}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      <AssetAvatar asset={a} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{a.ticker}</span>
                          <Badge variant={a.type === "ETF" ? "etf" : "stock"}>{a.type}</Badge>
                        </div>
                        <div className="max-w-[140px] truncate text-xs font-normal text-muted-foreground">
                          {a.name}
                        </div>
                      </div>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <Fragment key={section}>
                  <tr>
                    <td
                      colSpan={assets.length + 1}
                      className="bg-muted/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
                    >
                      {section}
                    </td>
                  </tr>
                  {visibleRows
                    .filter((r) => r.section === section)
                    .map((row) => (
                      <tr key={row.label} className="border-b border-border/60 hover:bg-secondary/20">
                        <td className="sticky left-0 z-10 bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
                          {row.label}
                        </td>
                        {assets.map((a) => {
                          const value = row.get(a);
                          const numeric = row.raw(a);
                          const isPct = typeof numeric === "number" && value.includes("%");
                          const colorClass =
                            isPct && row.label.startsWith("Performance")
                              ? (numeric as number) >= 0
                                ? "text-bull"
                                : "text-bear"
                              : "";
                          return (
                            <td
                              key={a.id}
                              className={cn(
                                "px-4 py-2 font-mono text-xs tabular-nums",
                                colorClass
                              )}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      {etfAssets.length >= 2 && <OverlapAnalysis etfs={etfAssets} />}
      {etfAssets.length >= 1 && <TopHoldingsComparison etfs={etfAssets} />}
    </Card>
  );
}

function OverlapAnalysis({ etfs }: { etfs: Asset[] }) {
  return (
    <div className="border-t border-border p-4">
      <h4 className="mb-1 text-sm font-semibold">Überschneidungs-Analyse (Overlap)</h4>
      <p className="mb-3 text-xs text-muted-foreground">
        Geschätzte Gewichtungsüberschneidung basierend auf den jeweiligen Top-10-Positionen.
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="px-3 py-1.5 text-left text-muted-foreground"> </th>
              {etfs.map((e) => (
                <th key={e.id} className="px-3 py-1.5 text-left font-medium">
                  {e.ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {etfs.map((rowEtf) => (
              <tr key={rowEtf.id} className="border-t border-border/60">
                <td className="px-3 py-1.5 font-medium">{rowEtf.ticker}</td>
                {etfs.map((colEtf) => {
                  if (rowEtf.id === colEtf.id) {
                    return (
                      <td key={colEtf.id} className="px-3 py-1.5 text-muted-foreground">
                        —
                      </td>
                    );
                  }
                  const overlap = calcOverlap(rowEtf, colEtf);
                  return (
                    <td key={colEtf.id} className="px-3 py-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono tabular-nums",
                          overlap > 40
                            ? "bg-bear/15 text-bear"
                            : overlap > 15
                            ? "bg-neutral/15 text-neutral"
                            : "bg-bull/15 text-bull"
                        )}
                      >
                        {formatNumber(overlap, 1)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopHoldingsComparison({ etfs }: { etfs: Asset[] }) {
  return (
    <div className="border-t border-border p-4">
      <h4 className="mb-3 text-sm font-semibold">Top-10-Positionen</h4>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${etfs.length}, minmax(160px, 1fr))` }}>
        {etfs.map((e) => (
          <div key={e.id}>
            <div className="mb-2 flex items-center gap-2">
              <AssetAvatar asset={e} size="sm" />
              <span className="text-xs font-semibold">{e.ticker}</span>
            </div>
            <ol className="space-y-1">
              {e.etf?.topHoldings.map((h, i) => (
                <li key={h.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">
                    {i + 1}. {h.name}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">{formatNumber(h.weight, 1)}%</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
