import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { fetchDeadlockRank } from "@/lib/deadlock";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recalculateTeamsForUser } from "@/lib/team-ranks";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ message: "You must sign in first." }, { status: 401 });
  }

  const rank = await fetchDeadlockRank(session.user.steamId);

  if (!rank) {
    return NextResponse.json({ message: "Deadlock rank sync is not configured." }, { status: 400 });
  }

  session.user.deadlockRank = rank.rank;
  session.user.deadlockRankBadgeLevel = rank.badgeLevel;
  await session.save();

  if (await canUseDatabase()) {
    const update = await prisma.user.updateMany({
      where: { steamId: session.user.steamId },
      data: {
        deadlockRank: rank.rank,
        deadlockRankTier: rank.tier,
        deadlockRankSubrank: rank.subrank,
        deadlockRankBadgeLevel: rank.badgeLevel,
        deadlockRankFetchedAt: rank.fetchedAt,
      },
    });

    if (update.count > 0) {
      const user = await prisma.user.findUnique({
        where: { steamId: session.user.steamId },
        select: { id: true },
      });

      if (user) {
        await recalculateTeamsForUser(user.id);
      }
    }
  }

  return NextResponse.json({ message: "Rank synced.", rank: rank.rank });
}
