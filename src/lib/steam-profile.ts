const STEAM_ID64_ACCOUNT_ID_OFFSET = BigInt("76561197960265728");

export function getSteamProfileUrl(steamId: string) {
  return `https://steamcommunity.com/profiles/${steamId}`;
}

export function getSteamAccountId(steamId64: string) {
  if (!/^\d+$/.test(steamId64)) {
    return null;
  }

  const accountId = BigInt(steamId64) - STEAM_ID64_ACCOUNT_ID_OFFSET;

  if (accountId < 0) {
    return null;
  }

  return accountId.toString();
}

export function getStatlockerProfileUrl(steamId64: string) {
  const accountId = getSteamAccountId(steamId64);

  return accountId ? `https://statlocker.gg/profile/${accountId}` : null;
}
