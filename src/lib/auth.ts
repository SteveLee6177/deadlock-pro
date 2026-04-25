import { hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();

  if (!session.user) {
    return null;
  }

  if (!hasDatabase()) {
    return session.user;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        steamId: true,
        profileName: true,
        avatarUrl: true,
        deadlockRank: true,
      },
    });

    return user ?? session.user;
  } catch {
    return session.user;
  }
}
