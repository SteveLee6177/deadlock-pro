import { NextRequest, NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { fetchDeadlockRank } from "@/lib/deadlock";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSteamProfileSummary, verifySteamResponse } from "@/lib/steam";

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
    const user = await prisma.user.upsert({
      where: { steamId },
      update: {
        profileName: profile?.profileName ?? `Steam ${steamId.slice(-4)}`,
        avatarUrl: profile?.avatarUrl ?? null,
        deadlockRank: rank?.rank ?? null,
        deadlockRankTier: rank?.tier ?? null,
      },
      create: {
        steamId,
        profileName: profile?.profileName ?? `Steam ${steamId.slice(-4)}`,
        avatarUrl: profile?.avatarUrl ?? null,
        deadlockRank: rank?.rank ?? null,
        deadlockRankTier: rank?.tier ?? null,
      },
    });

    session.user = {
      id: user.id,
      steamId: user.steamId,
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
    };
  } else {
    session.user = {
      id: `steam-${steamId}`,
      steamId,
      profileName: profile?.profileName ?? `Steam ${steamId.slice(-4)}`,
      avatarUrl: profile?.avatarUrl ?? null,
      deadlockRank: rank?.rank ?? null,
    };
  }

  await session.save();

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
