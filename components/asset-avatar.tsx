import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AssetAvatar({
  asset,
  size = "md",
  className,
}: {
  asset: Pick<Asset, "ticker" | "logoColor">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-11 w-11 text-sm",
  }[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        sizeClasses,
        className
      )}
      style={{ backgroundColor: asset.logoColor }}
    >
      {asset.ticker.slice(0, 2)}
    </div>
  );
}
