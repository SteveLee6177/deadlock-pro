import Image from "next/image";
import { getRankIconUrl, parseRankBadgeLevel, parseRankLabel } from "@/lib/rank-icons";
import { cn } from "@/lib/utils";

type RankBadgeProps = {
  badgeLevel?: number | null;
  className?: string;
  rank?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClassNames = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-16 w-16",
};

const imageDimensions = {
  sm: 32,
  md: 44,
  lg: 64,
};

export function RankBadge({
  badgeLevel,
  className,
  rank,
  size = "md",
}: RankBadgeProps) {
  const parsedRank = parseRankBadgeLevel(badgeLevel) ?? parseRankLabel(rank);
  const label = parsedRank?.label ?? "Unranked";

  return (
    <Image
      src={getRankIconUrl(parsedRank, size === "lg" ? "large" : "small")}
      alt={label}
      title={label}
      width={imageDimensions[size]}
      height={imageDimensions[size]}
      loading="lazy"
      className={cn("inline-block object-contain", sizeClassNames[size], className)}
    />
  );
}
