import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { fetchDeadlockRank } from "@/lib/deadlock";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
  await session.save();

  if (await canUseDatabase()) {
    await prisma.user.updateMany({
      where: { steamId: session.user.steamId },
      data: {
        deadlockRank: rank.rank,
        deadlockRankTier: rank.tier,
      },
    });
  }

  return NextResponse.json({ message: "Rank synced.", rank: rank.rank });
}
