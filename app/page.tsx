"use client";

import { LineChart } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { SelectedAssetsBar } from "@/components/selected-assets-bar";
import { ComparisonTable } from "@/components/comparison-table";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { ForecastSection } from "@/components/charts/forecast-section";
import { LivePricePanel } from "@/components/charts/live-price-panel";
import { NewsPanel } from "@/components/news-panel";
import { AssetDetailModal } from "@/components/asset-detail-modal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDashboardStore } from "@/lib/store";
import { getAssetById } from "@/lib/mock-data";
import type { Asset } from "@/lib/types";

export default function Home() {
  const selectedAssetIds = useDashboardStore((s) => s.selectedAssetIds);
  const assets = selectedAssetIds
    .map((id) => getAssetById(id))
    .filter((a): a is Asset => Boolean(a));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="container flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <LineChart className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold leading-tight">ETF &amp; Aktien Analyzer</h1>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    Analyse, Vergleich &amp; KI-News-Auswertung
                  </p>
                </div>
              </div>
              <SearchBar />
            </div>
            <SelectedAssetsBar />
          </div>
        </header>

        <main className="container flex flex-col gap-5 py-6">
          <ComparisonTable />

          <div className="grid gap-5 xl:grid-cols-5">
            <div className="flex flex-col gap-5 xl:col-span-3">
              <PerformanceChart assets={assets} />
              <LivePricePanel />
              <AllocationChart assets={assets} />
              <ForecastSection assets={assets} />
            </div>
            <div className="xl:col-span-2">
              <NewsPanel assets={assets} />
            </div>
          </div>
        </main>

        <footer className="container py-8 text-center text-xs text-muted-foreground">
          Alle Daten sind Beispieldaten (Mock) zu Demonstrationszwecken · Keine Anlageberatung.
        </footer>

        <AssetDetailModal />
      </div>
    </TooltipProvider>
  );
}
