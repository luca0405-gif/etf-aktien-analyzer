"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ForecastChart } from "@/components/charts/forecast-chart";
import type { Asset } from "@/lib/types";

export function ForecastSection({ assets }: { assets: Asset[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(assets[0]?.id);

  useEffect(() => {
    if (!assets.find((a) => a.id === selectedId)) {
      setSelectedId(assets[0]?.id);
    }
  }, [assets, selectedId]);

  const asset = assets.find((a) => a.id === selectedId) ?? assets[0];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Zukunfts-Prognose</CardTitle>
          <CardDescription>Bull-, Base- und Bear-Case (12–36 Monate)</CardDescription>
        </div>
        {assets.length > 1 && (
          <Select value={asset?.id} onValueChange={setSelectedId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.ticker} · {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {asset ? (
          <ForecastChart asset={asset} />
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Wähle mindestens ein Asset aus, um Szenario-Prognosen zu sehen.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
