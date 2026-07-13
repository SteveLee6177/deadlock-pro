import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env, getBaseUrl } from "@/lib/env";

export type DeadlockSession = {
  authReturnTo?: string;
  user?: {
    id: string;
    steamId: string;
    discordUsername: string | null;
    profileName: string;
    avatarUrl: string | null;
    deadlockRank: string | null;
    deadlockRankBadgeLevel: number | null;
  };
};

export const sessionOptions: SessionOptions = {
  password:
    env.sessionPassword ??
    "development-only-session-password-change-this-in-production-12345",
  cookieName: "deadlock-pro-session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: getBaseUrl().startsWith("https://"),
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<DeadlockSession>(cookieStore, sessionOptions);
}
