export function parseLocalTestAllowedSteamIds(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((steamId) => steamId.trim())
      .filter((steamId) => /^\d{16,20}$/.test(steamId)),
  );
}

export const LOCAL_TEST_ALLOWED_STEAM_IDS = parseLocalTestAllowedSteamIds(
  process.env.LOCAL_TEST_AUTH_ALLOWED_STEAM_IDS,
);

export const LOCAL_TEST_AUTH_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.ENABLE_LOCAL_TEST_AUTH === "true" &&
  LOCAL_TEST_ALLOWED_STEAM_IDS.size > 0;

export type LocalTestPlayer = {
  steamId: string;
  profileName: string;
  discordUsername: string;
  role: "OWNER" | "MANAGER" | "CAPTAIN" | "PLAYER" | "SUB" | "COACH";
  deadlockRank: string;
  deadlockRankBadgeLevel: number;
};

export type LocalTestTeam = {
  slug: string;
  name: string;
  tag: string;
  region: "NA" | "EU";
  focus: string;
  primaryRank: string;
  primaryRankBadgeLevel: number;
  description: string;
  openRoles: string[];
  players: LocalTestPlayer[];
};

export const localTestTeams: LocalTestTeam[] = [];

export const localTestAccounts = localTestTeams
  .map((team) => ({
    teamName: team.name,
    teamSlug: team.slug,
    steamId: team.players[0].steamId,
    profileName: team.players[0].profileName,
  }))
  .filter((account) => LOCAL_TEST_ALLOWED_STEAM_IDS.has(account.steamId));
