"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AssetAvatar } from "@/components/asset-avatar";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { NewsPanel } from "@/components/news-panel";
import { useDashboardStore } from "@/lib/store";
import { getAssetById } from "@/lib/mock-data";
import { formatCompact, formatNumber, formatPercent } from "@/lib/utils";
import type { Asset } from "@/lib/types";

export function AssetDetailModal() {
  const { modalAssetId, closeAssetModal, activeDetailTab, setActiveDetailTab } =
    useDashboardStore();
  const asset = modalAssetId ? getAssetById(modalAssetId) : undefined;

  return (
    <Dialog open={Boolean(asset)} onOpenChange={(open) => !open && closeAssetModal()}>
      {asset && (
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AssetAvatar asset={asset} size="lg" />
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {asset.name}
                  <Badge variant={asset.type === "ETF" ? "etf" : "stock"}>{asset.type}</Badge>
                </DialogTitle>
                <DialogDescription className="font-mono">
                  {asset.ticker} · {asset.isin} · {asset.currency}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 pt-3">
            <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
              <TabsList>
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="metrics">Kennzahlen</TabsTrigger>
                <TabsTrigger value="forecast">Prognose</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab asset={asset} />
              </TabsContent>
              <TabsContent value="metrics">
                <MetricsTab asset={asset} />
              </TabsContent>
              <TabsContent value="forecast">
                <ForecastChart asset={asset} />
              </TabsContent>
              <TabsContent value="news">
                <NewsPanel assets={[asset]} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={
          "mt-1 font-mono text-lg tabular-nums " +
          (tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}

function OverviewTab({ asset }: { asset: Asset }) {
  const p = asset.performance;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="1 Jahr" value={formatPercent(p.y1)} tone={p.y1 >= 0 ? "bull" : "bear"} />
        <StatTile label="YTD" value={formatPercent(p.ytd)} tone={p.ytd >= 0 ? "bull" : "bear"} />
        <StatTile label="Volatilität" value={`${formatNumber(p.volatility, 1)}%`} />
        <StatTile label="Sharpe Ratio" value={formatNumber(p.sharpeRatio, 2)} />
      </div>
      <PerformanceChart assets={[asset]} />
    </div>
  );
}

function MetricsTab({ asset }: { asset: Asset }) {
  return (
    <div className="space-y-5">
      {asset.etf && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">ETF-Kennzahlen</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="TER" value={`${formatNumber(asset.etf.ter, 2)}%`} />
            <StatTile label="Fondsvolumen" value={`€${formatCompact(asset.etf.aum)}`} />
            <StatTile label="Replikation" value={asset.etf.replicationMethod} />
            <StatTile label="Ertragsverwendung" value={asset.etf.distributionPolicy} />
            <StatTile label="Fondsdomizil" value={asset.etf.fundDomicile} />
            <StatTile label="Auflagedatum" value={asset.etf.inceptionDate} />
          </div>
          <h4 className="mb-2 mt-4 text-sm font-semibold">Top-10-Positionen</h4>
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1">
            {asset.etf.topHoldings.map((h, i) => (
              <li key={h.name} className="flex items-center justify-between text-xs">
                <span className="truncate text-muted-foreground">
                  {i + 1}. {h.name}
                </span>
                <span className="font-mono tabular-nums">{formatNumber(h.weight, 1)}%</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {asset.stock && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Fundamentaldaten</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="KGV (P/E)" value={formatNumber(asset.stock.pe, 1)} />
            <StatTile label="KBV (P/B)" value={formatNumber(asset.stock.pb, 1)} />
            <StatTile label="Dividendenrendite" value={`${formatNumber(asset.stock.dividendYield, 2)}%`} />
            <StatTile label="Umsatzwachstum YoY" value={formatPercent(asset.stock.revenueGrowthYoY)} />
            <StatTile label="Umsatzwachstum 3J CAGR" value={formatPercent(asset.stock.revenueGrowth3yCagr)} />
            <StatTile label="Gewinnwachstum YoY" value={formatPercent(asset.stock.profitGrowthYoY)} />
            <StatTile label="Gewinnwachstum 3J CAGR" value={formatPercent(asset.stock.profitGrowth3yCagr)} />
            <StatTile label="Debt/Equity" value={formatNumber(asset.stock.debtToEquity, 2)} />
            <StatTile label="FCF-Marge" value={`${formatNumber(asset.stock.fcfMargin, 1)}%`} />
            <StatTile label="Marktkapitalisierung" value={`€${formatCompact(asset.stock.marketCap)}`} />
            <StatTile label="Sektor" value={asset.stock.sector} />
          </div>
        </div>
      )}
    </div>
  );
}
