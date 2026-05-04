import { env } from "@/lib/env";
import { getRedisPublisher } from "@/lib/redis";
import { getSteamAccountId } from "@/lib/steam-profile";

const DEFAULT_RANK_CACHE_TTL_HOURS = 24 * 7;
const DEFAULT_GLOBAL_LIMIT_PER_HOUR = 60;
const DEFAULT_PLAYER_LIMIT_PER_DAY = 1;

const memoryRateLimits = new Map<string, { count: number; resetAt: number }>();

export const DEADLOCK_RANK_TIERS = [
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

type DeadlockPlayerCard = {
  ranked_badge_level?: number | null;
  ranked_rank?: number | null;
  ranked_subrank?: number | null;
};

type DeadlockMmrHistoryEntry = {
  rank?: number | null;
  division?: number | null;
  division_tier?: number | null;
  start_time?: number | null;
};

export type DeadlockRank = {
  rank: string;
  tier: number | null;
  subrank: number | null;
  badgeLevel: number | null;
  fetchedAt: Date;
  raw: unknown;
};

function envNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

export function getDeadlockRankCacheTtlMs() {
  const ttlHours = envNumber(
    process.env.DEADLOCK_RANK_CACHE_TTL_HOURS,
    DEFAULT_RANK_CACHE_TTL_HOURS,
  );

  return ttlHours * 60 * 60 * 1000;
}

export function isDeadlockRankFresh(fetchedAt: Date | null | undefined) {
  return Boolean(fetchedAt && Date.now() - fetchedAt.getTime() < getDeadlockRankCacheTtlMs());
}

function getDeadlockAccountId(steamId64: string) {
  return getSteamAccountId(steamId64) ?? steamId64;
}

function getDeadlockBaseUrl() {
  return (env.deadlockApiBaseUrl ?? "https://api.deadlock-api.com")
    .replace(/\/$/, "")
    .replace(/\/v1$/, "");
}

function buildProfileUrl(steamId64: string) {
  const accountId = getDeadlockAccountId(steamId64);

  if (env.deadlockApiProfileUrlTemplate) {
    return env.deadlockApiProfileUrlTemplate
      .replaceAll("{steamId}", steamId64)
      .replaceAll("{steamId64}", steamId64)
      .replaceAll("{accountId}", accountId)
      .replaceAll("{steamAccountId}", accountId);
  }

  return `${getDeadlockBaseUrl()}/v1/players/${accountId}/card`;
}

function buildMmrHistoryUrl(steamId64: string) {
  return `${getDeadlockBaseUrl()}/v1/players/${getDeadlockAccountId(steamId64)}/mmr-history`;
}

async function connectRedisIfNeeded() {
  const redis = getRedisPublisher();

  if (!redis) {
    return null;
  }

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    return redis;
  } catch {
    return null;
  }
}

async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = await connectRedisIfNeeded();

  if (redis) {
    try {
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      return count <= limit;
    } catch {
      // Fall back to in-memory limits below.
    }
  }

  const now = Date.now();
  const current = memoryRateLimits.get(key);

  if (!current || current.resetAt <= now) {
    memoryRateLimits.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });

    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

async function canCallDeadlockApi(steamId64: string) {
  const globalLimit = envNumber(
    process.env.DEADLOCK_API_GLOBAL_LIMIT_PER_HOUR,
    DEFAULT_GLOBAL_LIMIT_PER_HOUR,
  );
  const playerLimit = envNumber(
    process.env.DEADLOCK_API_PLAYER_LIMIT_PER_DAY,
    DEFAULT_PLAYER_LIMIT_PER_DAY,
  );
  const [globalAllowed, playerAllowed] = await Promise.all([
    consumeRateLimit("deadlock-api:rank:global", globalLimit, 60 * 60),
    consumeRateLimit(`deadlock-api:rank:player:${steamId64}`, playerLimit, 24 * 60 * 60),
  ]);

  return globalAllowed && playerAllowed;
}

function normalizeBadgeLevel(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 11 && value <= 116
    ? value
    : null;
}

export function formatDeadlockRank(
  badgeLevel: number | null | undefined,
  fallbackRank?: number | null,
  fallbackSubrank?: number | null,
) {
  const normalizedBadge = normalizeBadgeLevel(badgeLevel);
  const tier = normalizedBadge ? Math.floor(normalizedBadge / 10) : fallbackRank ?? null;
  const subrank = normalizedBadge ? normalizedBadge % 10 : fallbackSubrank ?? null;

  if (
    !tier ||
    !subrank ||
    tier < 1 ||
    tier > DEADLOCK_RANK_TIERS.length ||
    subrank < 1 ||
    subrank > 6
  ) {
    return "Unranked";
  }

  return `${DEADLOCK_RANK_TIERS[tier - 1]} ${subrank}`;
}

function parseDeadlockPlayerCard(payload: unknown): DeadlockRank {
  const payloadRecord = (payload && typeof payload === "object" ? payload : {}) as Record<
    string,
    unknown
  >;
  const source = (payloadRecord.player ??
    payloadRecord.data ??
    payloadRecord.profile ??
    payloadRecord) as DeadlockPlayerCard;
  const badgeLevel = normalizeBadgeLevel(source.ranked_badge_level);
  const tier =
    badgeLevel !== null
      ? Math.floor(badgeLevel / 10)
      : typeof source.ranked_rank === "number"
        ? source.ranked_rank
        : null;
  const subrank =
    badgeLevel !== null
      ? badgeLevel % 10
      : typeof source.ranked_subrank === "number"
        ? source.ranked_subrank
        : null;

  return {
    rank: formatDeadlockRank(badgeLevel, tier, subrank),
    tier,
    subrank,
    badgeLevel,
    fetchedAt: new Date(),
    raw: payload,
  };
}

function parseDeadlockMmrHistory(payload: unknown): DeadlockRank | null {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const latestEntry = payload
    .filter((entry): entry is DeadlockMmrHistoryEntry => Boolean(entry && typeof entry === "object"))
    .reduce<DeadlockMmrHistoryEntry | null>((latest, entry) => {
      if (!latest) {
        return entry;
      }

      return (entry.start_time ?? 0) > (latest.start_time ?? 0) ? entry : latest;
    }, null);
  const badgeLevel = normalizeBadgeLevel(latestEntry?.rank);

  if (!latestEntry || !badgeLevel) {
    return null;
  }

  return {
    rank: formatDeadlockRank(badgeLevel, latestEntry.division, latestEntry.division_tier),
    tier: Math.floor(badgeLevel / 10),
    subrank: badgeLevel % 10,
    badgeLevel,
    fetchedAt: new Date(),
    raw: latestEntry,
  };
}

export function deadlockBadgeToOrdinal(badgeLevel: number | null | undefined) {
  const normalizedBadge = normalizeBadgeLevel(badgeLevel);

  if (!normalizedBadge) {
    return null;
  }

  return (Math.floor(normalizedBadge / 10) - 1) * 6 + (normalizedBadge % 10);
}

export function deadlockOrdinalToBadge(ordinal: number | null | undefined) {
  if (!ordinal || ordinal < 1 || ordinal > DEADLOCK_RANK_TIERS.length * 6) {
    return null;
  }

  const rounded = Math.round(ordinal);
  const tier = Math.floor((rounded - 1) / 6) + 1;
  const subrank = ((rounded - 1) % 6) + 1;

  return tier * 10 + subrank;
}

export function averageDeadlockBadgeLevels(badgeLevels: Array<number | null | undefined>) {
  const ordinals = badgeLevels
    .map(deadlockBadgeToOrdinal)
    .filter((ordinal): ordinal is number => ordinal !== null);

  if (ordinals.length === 0) {
    return null;
  }

  const average = ordinals.reduce((sum, ordinal) => sum + ordinal, 0) / ordinals.length;

  return deadlockOrdinalToBadge(average);
}

export async function fetchDeadlockRank(steamId64: string): Promise<DeadlockRank | null> {
  const profileUrl = buildProfileUrl(steamId64);

  if (!profileUrl || !(await canCallDeadlockApi(steamId64))) {
    return null;
  }

  const headers = env.deadlockApiKey
    ? {
        Authorization: `Bearer ${env.deadlockApiKey}`,
        "X-API-Key": env.deadlockApiKey,
      }
    : undefined;
  const response = await fetch(profileUrl, {
    cache: "no-store",
    headers,
  });

  if (response.ok) {
    return parseDeadlockPlayerCard(await response.json());
  }

  const fallbackResponse = await fetch(buildMmrHistoryUrl(steamId64), {
    cache: "no-store",
    headers,
  });

  if (!fallbackResponse.ok) {
    return null;
  }

  return parseDeadlockMmrHistory(await fallbackResponse.json());
}
