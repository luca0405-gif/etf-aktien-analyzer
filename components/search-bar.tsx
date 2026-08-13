"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Plus, Check } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AssetAvatar } from "@/components/asset-avatar";
import { MAX_SELECTED_ASSETS, useDashboardStore } from "@/lib/store";
import { apiSearchAssets } from "@/lib/api";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const { selectedAssetIds, toggleAsset } = useDashboardStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    apiSearchAssets(query).then((res) => {
      if (active) setResults(res);
    });
    return () => {
      active = false;
    };
  }, [query]);

  const atLimit = selectedAssetIds.length >= MAX_SELECTED_ASSETS;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Ticker, ISIN oder Name suchen…"
            className="pl-9"
          />
          {query && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-[--radix-popover-trigger-width] min-w-[22rem] overflow-hidden rounded-lg border border-border bg-popover shadow-xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {results.length} Ergebnis{results.length === 1 ? "" : "se"}
            </span>
            <span
              className={cn(
                "text-xs tabular-nums",
                atLimit ? "text-neutral" : "text-muted-foreground"
              )}
            >
              {selectedAssetIds.length}/{MAX_SELECTED_ASSETS} ausgewählt
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {results.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Keine Treffer für &quot;{query}&quot;
              </div>
            )}
            {results.map((asset) => {
              const selected = selectedAssetIds.includes(asset.id);
              const disabled = !selected && atLimit;
              return (
                <button
                  key={asset.id}
                  disabled={disabled}
                  onClick={() => toggleAsset(asset.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/60",
                    disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                  )}
                >
                  <AssetAvatar asset={asset} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{asset.name}</span>
                      <Badge variant={asset.type === "ETF" ? "etf" : "stock"}>
                        {asset.type}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex gap-2 font-mono text-[11px] text-muted-foreground">
                      <span>{asset.ticker}</span>
                      <span>·</span>
                      <span>{asset.isin}</span>
                    </div>
                  </div>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
