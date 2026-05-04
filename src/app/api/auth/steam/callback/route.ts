import { NextRequest, NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { fetchDeadlockRank } from "@/lib/deadlock";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSteamProfileSummary, verifySteamResponse } from "@/lib/steam";
import { recalculateTeamsForUser } from "@/lib/team-ranks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const steamId = await verifySteamResponse(request.url);

  if (!steamId) {
    return NextResponse.redirect(new URL("/sign-in?error=verification", request.url));
  }

  const [profile, rank] = await Promise.all([
    getSteamProfileSummary(steamId),
    fetchDeadlockRank(steamId),
  ]);

  const session = await getSession();

  if (await canUseDatabase()) {
    const rankData = rank
      ? {
          deadlockRank: rank.rank,
          deadlockRankTier: rank.tier,
          deadlockRankSubrank: rank.subrank,
          deadlockRankBadgeLevel: rank.badgeLevel,
          deadlockRankFetchedAt: rank.fetchedAt,
        }
      : {};
    const user = await prisma.user.upsert({
      where: { steamId },
      update: {
        profileName: profile?.profileName ?? `Steam ${steamId.slice(-4)}`,
        avatarUrl: profile?.avatarUrl ?? null,
        ...rankData,
      },
      create: {
        steamId,
        profileName: profile?.profileName ?? `Steam ${steamId.slice(-4)}`,
        avatarUrl: profile?.avatarUrl ?? null,
        deadlockRank: rank?.rank ?? null,
        deadlockRankTier: rank?.tier ?? null,
        deadlockRankSubrank: rank?.subrank ?? null,
        deadlockRankBadgeLevel: rank?.badgeLevel ?? null,
        deadlockRankFetchedAt: rank?.fetchedAt ?? null,
      },
    });

    if (rank) {
      await recalculateTeamsForUser(user.id);
    }

    session.user = {
      id: user.id,
      steamId: user.steamId,
      discordUsername: user.discordUsername,
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
      deadlockRankBadgeLevel: user.deadlockRankBadgeLevel,
    };
  } else {
    session.user = {
      id: `steam-${steamId}`,
      steamId,
      discordUsername: null,
      profileName: profile?.profileName ?? `Steam ${steamId.slice(-4)}`,
      avatarUrl: profile?.avatarUrl ?? null,
      deadlockRank: rank?.rank ?? null,
      deadlockRankBadgeLevel: rank?.badgeLevel ?? null,
    };
  }

  await session.save();

  const returnTo = session.authReturnTo;
  session.authReturnTo = undefined;
  await session.save();

  return NextResponse.redirect(new URL(returnTo ?? "/dashboard", request.url));
}
