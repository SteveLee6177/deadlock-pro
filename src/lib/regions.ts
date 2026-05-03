export const REGION_OPTIONS = ["NA", "EU", "OCE", "SA", "Asia"] as const;

export type RegionOption = (typeof REGION_OPTIONS)[number];

export function normalizeRegion(region: string): RegionOption {
  const normalized = region.trim().toLowerCase();

  if (normalized.startsWith("na") || normalized.includes("north america")) {
    return "NA";
  }

  if (normalized.startsWith("eu") || normalized.includes("europe")) {
    return "EU";
  }

  if (normalized.startsWith("oce") || normalized.includes("oceania")) {
    return "OCE";
  }

  if (normalized === "sa" || normalized.includes("south america")) {
    return "SA";
  }

  if (normalized.includes("asia")) {
    return "Asia";
  }

  return REGION_OPTIONS.includes(region as RegionOption) ? (region as RegionOption) : "NA";
}
