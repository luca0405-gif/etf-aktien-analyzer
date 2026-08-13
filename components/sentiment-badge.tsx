import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Sentiment } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  Sentiment,
  { variant: "bullish" | "bearish" | "neutral"; icon: typeof ArrowUpRight; label: string }
> = {
  Bullisch: { variant: "bullish", icon: ArrowUpRight, label: "Bullisch" },
  Bärisch: { variant: "bearish", icon: ArrowDownRight, label: "Bärisch" },
  Neutral: { variant: "neutral", icon: Minus, label: "Neutral" },
};

export function SentimentBadge({
  sentiment,
  score,
  className,
}: {
  sentiment: Sentiment;
  score?: number;
  className?: string;
}) {
  const cfg = CONFIG[sentiment];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
      {typeof score === "number" && (
        <span className="opacity-70 tabular-nums">· {score}</span>
      )}
    </Badge>
  );
}

export function sentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case "Bullisch":
      return "hsl(var(--bull))";
    case "Bärisch":
      return "hsl(var(--bear))";
    default:
      return "hsl(var(--neutral))";
  }
}
