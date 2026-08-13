"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssetAvatar } from "@/components/asset-avatar";
import { SentimentBadge } from "@/components/sentiment-badge";
import { getNewsForAsset } from "@/lib/mock-data";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import type { Asset, NewsItem, Sentiment } from "@/lib/types";

const SENTIMENT_FILTERS: Sentiment[] = ["Bullisch", "Neutral", "Bärisch"];

export function NewsPanel({ assets }: { assets: Asset[] }) {
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | "all">("all");

  const allNews = useMemo(() => {
    const combined = assets.flatMap((a) => getNewsForAsset(a.id));
    return combined.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [assets]);

  const filtered = allNews.filter((item) => {
    if (assetFilter !== "all" && item.assetId !== assetFilter) return false;
    if (sentimentFilter !== "all" && item.sentiment !== sentimentFilter) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              News &amp; KI-Sentiment
            </CardTitle>
            <CardDescription>Quelle: finanzen.net · KI-gestützte Auswertung</CardDescription>
          </div>
        </div>
        {assets.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={assetFilter === "all"} onClick={() => setAssetFilter("all")}>
              Alle Assets
            </FilterChip>
            {assets.map((a) => (
              <FilterChip
                key={a.id}
                active={assetFilter === a.id}
                onClick={() => setAssetFilter(a.id)}
              >
                {a.ticker}
              </FilterChip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={sentimentFilter === "all"} onClick={() => setSentimentFilter("all")}>
            Alle Stimmungen
          </FilterChip>
          {SENTIMENT_FILTERS.map((s) => (
            <FilterChip
              key={s}
              active={sentimentFilter === s}
              onClick={() => setSentimentFilter(s)}
            >
              {s}
            </FilterChip>
          ))}
        </div>
      </CardHeader>
      <CardContent className="max-h-[640px] space-y-3 overflow-y-auto scrollbar-thin">
        {assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Wähle Assets aus, um relevante News zu sehen.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Keine News für die aktuelle Filterauswahl.
          </p>
        ) : (
          filtered.map((item) => {
            const asset = assets.find((a) => a.id === item.assetId);
            return <NewsCard key={item.id} item={item} asset={asset} />;
          })
        )}
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "h-6 rounded-full px-2.5 text-[11px]",
        active ? "border border-primary/40 text-foreground" : "text-muted-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function NewsCard({ item, asset }: { item: NewsItem; asset?: Asset }) {
  return (
    <article className="rounded-lg border border-border bg-secondary/10 p-3 transition-colors hover:border-primary/30">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {asset && <AssetAvatar asset={asset} size="sm" />}
          <div>
            <div className="flex items-center gap-1.5">
              {asset && <span className="text-xs font-semibold">{asset.ticker}</span>}
              <Badge variant="outline" className="text-[10px]">
                {item.type}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground" title={formatDate(item.publishedAt)}>
              {timeAgo(item.publishedAt)}
            </span>
          </div>
        </div>
        <SentimentBadge sentiment={item.sentiment} score={item.sentimentScore} />
      </div>

      <h4 className="mb-1.5 text-sm font-medium leading-snug">{item.title}</h4>

      <ul className="mb-2 space-y-0.5">
        {item.aiSummary.map((point) => (
          <li key={point} className="text-xs leading-snug text-muted-foreground">
            <span className="text-primary">•</span> {point}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Quelle: finanzen.net
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Original lesen
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}
