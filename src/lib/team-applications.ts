import { prisma } from "@/lib/prisma";

export const TEAM_APPLICATION_REAPPLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

let declinedAtColumnCheck: Promise<boolean> | null = null;

type ApplicationCooldownFields = {
  createdAt: Date;
  declinedAt: Date | null;
};

export async function canStoreTeamApplicationDeclinedAt() {
  declinedAtColumnCheck ??= prisma
    .$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'TeamApplication'
          AND column_name = 'declinedAt'
      ) AS "exists"
    `
    .then((rows) => Boolean(rows[0]?.exists))
    .catch(() => false);

  return declinedAtColumnCheck;
}

export async function teamApplicationDeclineData(now = new Date()) {
  if (await canStoreTeamApplicationDeclinedAt()) {
    return { status: "DECLINED" as const, declinedAt: now };
  }

  return { status: "DECLINED" as const };
}

export async function teamApplicationInviteData() {
  if (await canStoreTeamApplicationDeclinedAt()) {
    return { status: "APPROVED" as const, declinedAt: null };
  }

  return { status: "APPROVED" as const };
}

export async function teamApplicationPendingData(message: string | undefined) {
  if (await canStoreTeamApplicationDeclinedAt()) {
    return { message, status: "PENDING" as const, declinedAt: null };
  }

  return { message, status: "PENDING" as const };
}

export function getTeamApplicationReapplyDate(application: ApplicationCooldownFields) {
  const declinedAt = application.declinedAt ?? application.createdAt;

  return new Date(declinedAt.getTime() + TEAM_APPLICATION_REAPPLY_COOLDOWN_MS);
}

export function canReapplyToDeclinedTeamApplication(
  application: ApplicationCooldownFields,
  now = new Date(),
) {
  return now >= getTeamApplicationReapplyDate(application);
}
