import { env, getBaseUrl, getSteamRealm } from "@/lib/env";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid";

type OpenIdModule = {
  RelyingParty: new (
    returnUrl: string,
    realm: string,
    stateless: boolean,
    strict: boolean,
    extensions: unknown[],
  ) => {
    authenticate(
      identifier: string,
      immediate: boolean,
      callback: (error: Error | null, authUrl?: string) => void,
    ): void;
    verifyAssertion(
      url: string,
      callback: (
        error: Error | null,
        result?: { authenticated?: boolean; claimedIdentifier?: string },
      ) => void,
    ): void;
  };
};

async function createRelyingParty() {
  const openidModule = (await import("openid")) as unknown as OpenIdModule;
  const returnUrl = `${getBaseUrl()}/api/auth/steam/callback`;
  const realm = getSteamRealm();

  return new openidModule.RelyingParty(returnUrl, realm, true, false, []);
}

function decodeXmlValue(value: string) {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function extractXmlField(xml: string, field: string) {
  const match = xml.match(new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`, "i"));
  return match?.[1] ? decodeXmlValue(match[1].trim()) : null;
}

export async function getSteamLoginUrl() {
  const relyingParty = await createRelyingParty();

  return new Promise<string>((resolve, reject) => {
    relyingParty.authenticate(STEAM_OPENID_URL, false, (error, authUrl) => {
      if (error || !authUrl) {
        reject(error ?? new Error("Steam auth URL was not created."));
        return;
      }

      resolve(authUrl);
    });
  });
}

export async function verifySteamResponse(url: string) {
  const relyingParty = await createRelyingParty();

  const result = await new Promise<{
    authenticated?: boolean;
    claimedIdentifier?: string;
  }>((resolve, reject) => {
    relyingParty.verifyAssertion(url, (error, authResult) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(authResult ?? {});
    });
  });

  if (!result.authenticated || !result.claimedIdentifier) {
    return null;
  }

  const steamId = result.claimedIdentifier.split("/").filter(Boolean).pop();
  return steamId && /^\d+$/.test(steamId) ? steamId : null;
}

export async function getSteamProfileSummary(steamId: string) {
  if (env.steamApiKey) {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.steamApiKey}&steamids=${steamId}`,
      { cache: "no-store" },
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        response?: {
          players?: Array<{
            personaname?: string;
            avatarfull?: string;
          }>;
        };
      };

      const player = payload.response?.players?.[0];

      if (player?.personaname) {
        return {
          profileName: player.personaname,
          avatarUrl: player.avatarfull ?? null,
        };
      }
    }
  }

  const response = await fetch(`https://steamcommunity.com/profiles/${steamId}?xml=1`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const xml = await response.text();
  const profileName = extractXmlField(xml, "steamID");
  const avatarUrl = extractXmlField(xml, "avatarFull");

  if (!profileName) {
    return null;
  }

  return {
    profileName,
    avatarUrl,
  };
}
