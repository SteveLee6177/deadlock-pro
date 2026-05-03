import { canUseDatabase } from "@/lib/database";
import { prisma } from "@/lib/prisma";

const SCRIM_MANAGER_ROLES = new Set(["OWNER", "MANAGER"]);

export function isScrimManagerRole(role: string | null | undefined) {
  return Boolean(role && SCRIM_MANAGER_ROLES.has(role));
}

export async function canManageTeamScrims(userId: string, teamId: string) {
  if (!(await canUseDatabase())) {
    return false;
  }

  const membership = await prisma.teamMembership.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  return isScrimManagerRole(membership?.role);
}

export async function canViewTeamScrims(userId: string, teamId: string) {
  if (!(await canUseDatabase())) {
    return false;
  }

  const membership = await prisma.teamMembership.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

export async function canRequestScrim(userId: string, teamId: string) {
  return canManageTeamScrims(userId, teamId);
}
