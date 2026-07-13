export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
  steamApiKey: process.env.STEAM_API_KEY,
  steamRealm: process.env.STEAM_REALM,
  sessionPassword: process.env.SESSION_PASSWORD,
  deadlockApiBaseUrl: process.env.DEADLOCK_API_BASE_URL,
  deadlockApiKey: process.env.DEADLOCK_API_KEY,
  deadlockApiProfileUrlTemplate: process.env.DEADLOCK_API_PROFILE_URL_TEMPLATE,
  enableLocalTestAuth: process.env.ENABLE_LOCAL_TEST_AUTH,
  localTestAuthAllowedSteamIds: process.env.LOCAL_TEST_AUTH_ALLOWED_STEAM_IDS,
};

export function getBaseUrl() {
  return env.appUrl.replace(/\/$/, "");
}

export function getAppUrl(path = "/") {
  return new URL(path, `${getBaseUrl()}/`).toString();
}

export function getSteamRealm() {
  return env.steamRealm?.replace(/\/$/, "") ?? getBaseUrl();
}

export function hasDatabase() {
  return Boolean(env.databaseUrl);
}

export function hasRedis() {
  return Boolean(env.redisUrl);
}

export function hasSteamAuth() {
  return Boolean(env.sessionPassword);
}

export function hasSteamWebApi() {
  return Boolean(env.steamApiKey);
}

export function hasDeadlockApi() {
  return true;
}
