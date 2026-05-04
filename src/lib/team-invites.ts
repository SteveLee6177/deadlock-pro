import { randomBytes } from "crypto";
import { getBaseUrl } from "@/lib/env";

export const TEAM_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export function createTeamInviteToken() {
  return randomBytes(24).toString("base64url");
}

export function createTeamInviteExpiry(now = new Date()) {
  return new Date(now.getTime() + TEAM_INVITE_TTL_MS);
}

export function getTeamInviteUrl(token: string) {
  return new URL(`/invite/${token}`, getBaseUrl()).toString();
}

export function isActiveTeamInvite(inviteExpiresAt: Date | string | null | undefined) {
  return Boolean(inviteExpiresAt && new Date(inviteExpiresAt).getTime() > Date.now());
}

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
