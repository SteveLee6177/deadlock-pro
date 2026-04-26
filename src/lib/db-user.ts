import { getCurrentUser } from "@/lib/auth";
import { canUseDatabase } from "@/lib/database";
import { prisma } from "@/lib/prisma";

export async function getOrCreateCurrentDbUser() {
  if (!(await canUseDatabase())) {
    return null;
  }

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return prisma.user.upsert({
    where: { steamId: user.steamId },
    update: {
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
    },
    create: {
      steamId: user.steamId,
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
    },
  });
}

export async function getCurrentUserMemberships() {
  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return null;
  }

  const memberships = await prisma.teamMembership.findMany({
    where: { userId: user.id },
    include: {
      team: {
        select: {
          id: true,
          slug: true,
          name: true,
          tag: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return {
    user,
    memberships,
  };
}
