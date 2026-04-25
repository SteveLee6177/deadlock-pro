import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type DeadlockSession = {
  user?: {
    id: string;
    steamId: string;
    profileName: string;
    avatarUrl: string | null;
    deadlockRank: string | null;
  };
};

export const sessionOptions: SessionOptions = {
  password:
    env.sessionPassword ??
    "development-only-session-password-change-this-in-production-12345",
  cookieName: "deadlock-pro-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<DeadlockSession>(cookieStore, sessionOptions);
}
