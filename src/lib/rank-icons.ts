export const RANK_ICON_TIERS = [
  "Initiate",
  "Seeker",
  "Alchemist",
  "Arcanist",
  "Ritualist",
  "Emissary",
  "Archon",
  "Oracle",
  "Phantom",
  "Ascendant",
  "Eternus",
] as const;

const RANK_ICON_BASE_URL =
  "https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks";

export type ParsedRank = {
  tier: number;
  subrank: number | null;
  label: string;
};

export function parseRankLabel(rank: string | null | undefined): ParsedRank | null {
  if (!rank || /^unranked|obscurus$/i.test(rank.trim())) {
    return null;
  }

  const normalized = rank.replace(/\+/g, "").trim();
  const match = normalized.match(/^([a-z]+)(?:\s+([1-6]|i{1,3}|iv|v|vi))?/i);

  if (!match) {
    return null;
  }

  const tier = RANK_ICON_TIERS.findIndex(
    (rankName) => rankName.toLowerCase() === match[1]?.toLowerCase(),
  ) + 1;

  if (!tier) {
    return null;
  }

  const subrankValue = match[2]?.toLowerCase();
  const romanSubranks: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
  };
  const subrank = subrankValue
    ? Number(subrankValue) || romanSubranks[subrankValue] || null
    : null;

  return {
    tier,
    subrank,
    label: subrank ? `${RANK_ICON_TIERS[tier - 1]} ${subrank}` : RANK_ICON_TIERS[tier - 1],
  };
}

export function parseRankBadgeLevel(badgeLevel: number | null | undefined): ParsedRank | null {
  if (!badgeLevel || badgeLevel < 11 || badgeLevel > 116) {
    return null;
  }

  const tier = Math.floor(badgeLevel / 10);
  const subrank = badgeLevel % 10;

  if (tier < 1 || tier > RANK_ICON_TIERS.length || subrank < 1 || subrank > 6) {
    return null;
  }

  return {
    tier,
    subrank,
    label: `${RANK_ICON_TIERS[tier - 1]} ${subrank}`,
  };
}

export function getRankIconUrl(rank: ParsedRank | null | undefined, size: "small" | "large") {
  if (!rank) {
    return `${RANK_ICON_BASE_URL}/rank0/badge_${size === "small" ? "sm" : "lg"}.webp`;
  }

  const sizeKey = size === "small" ? "sm" : "lg";
  const subrankSuffix = rank.subrank ? `_subrank${rank.subrank}` : "";

  return `${RANK_ICON_BASE_URL}/rank${rank.tier}/badge_${sizeKey}${subrankSuffix}.webp`;
}
