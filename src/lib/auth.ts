import { canUseDatabase } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();

  if (!session.user) {
    return null;
  }

  if (!(await canUseDatabase())) {
    return session.user;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        steamId: true,
        discordUsername: true,
        profileName: true,
        avatarUrl: true,
        deadlockRank: true,
        deadlockRankBadgeLevel: true,
      },
    });

    return user ?? session.user;
  } catch {
    return session.user;
  }
}
