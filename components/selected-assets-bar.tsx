"use client";

import { X } from "lucide-react";
import { AssetAvatar } from "@/components/asset-avatar";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/lib/store";
import { getAssetById } from "@/lib/mock-data";
import { formatPercent } from "@/lib/utils";

export function SelectedAssetsBar() {
  const { selectedAssetIds, removeAsset, openAssetModal } = useDashboardStore();

  if (selectedAssetIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Wähle bis zu 4 ETFs oder Aktien über die Suche aus, um sie zu vergleichen.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedAssetIds.map((id) => {
        const asset = getAssetById(id);
        if (!asset) return null;
        const perf = asset.performance.ytd;
        return (
          <div
            key={id}
            className="group flex items-center gap-2 rounded-full border border-border bg-secondary/40 py-1 pl-1.5 pr-2.5 transition-colors hover:border-primary/40"
          >
            <button
              onClick={() => openAssetModal(id)}
              className="flex items-center gap-2"
            >
              <AssetAvatar asset={asset} size="sm" />
              <span className="text-sm font-medium">{asset.ticker}</span>
              <span
                className={
                  "font-mono text-xs tabular-nums " +
                  (perf >= 0 ? "text-bull" : "text-bear")
                }
              >
                {formatPercent(perf)}
              </span>
              <Badge variant={asset.type === "ETF" ? "etf" : "stock"} className="hidden sm:inline-flex">
                {asset.type}
              </Badge>
            </button>
            <button
              onClick={() => removeAsset(id)}
              aria-label={`${asset.name} entfernen`}
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
