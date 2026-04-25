import { env } from "@/lib/env";

function buildProfileUrl(steamId: string) {
  if (env.deadlockApiProfileUrlTemplate) {
    return env.deadlockApiProfileUrlTemplate.replaceAll("{steamId}", steamId);
  }

  if (env.deadlockApiBaseUrl) {
    return `${env.deadlockApiBaseUrl.replace(/\/$/, "")}/v1/players/${steamId}`;
  }

  return null;
}

export async function fetchDeadlockRank(steamId: string) {
  const url = buildProfileUrl(steamId);

  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: env.deadlockApiKey
      ? {
          Authorization: `Bearer ${env.deadlockApiKey}`,
        }
      : undefined,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const source = (payload.player ??
    payload.data ??
    payload.profile ??
    payload) as Record<string, unknown>;

  const mmr = source.mmr as Record<string, unknown> | undefined;
  const competitive = source.competitive_rank as Record<string, unknown> | undefined;

  const rank =
    (typeof source.rank === "string" && source.rank) ||
    (typeof source.rank_name === "string" && source.rank_name) ||
    (typeof mmr?.rankLabel === "string" && mmr.rankLabel) ||
    (typeof competitive?.tier_name === "string" && competitive.tier_name) ||
    (typeof source.mmrRank === "string" && source.mmrRank) ||
    null;

  const tier =
    (typeof source.rankTier === "number" && source.rankTier) ||
    (typeof mmr?.rankTier === "number" && mmr.rankTier) ||
    (typeof competitive?.tier === "number" && competitive.tier) ||
    null;

  return {
    rank,
    tier,
    raw: payload,
  };
}
