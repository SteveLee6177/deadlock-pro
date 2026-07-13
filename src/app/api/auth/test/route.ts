import { NextRequest, NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getAppUrl } from "@/lib/env";
import { LOCAL_TEST_AUTH_ENABLED, localTestAccounts } from "@/lib/local-test-data";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { safeReturnPath } from "@/lib/team-invites";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!LOCAL_TEST_AUTH_ENABLED) {
    return NextResponse.json({ message: "Local test auth is disabled." }, { status: 404 });
  }

  if (!(await canUseDatabase())) {
    return NextResponse.redirect(getAppUrl("/sign-in?error=test-db"));
  }

  const steamId =
    request.nextUrl.searchParams.get("steamId") ?? localTestAccounts[0]?.steamId ?? "";
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("returnTo"));
  const allowedSteamIds = new Set(localTestAccounts.map((account) => account.steamId));

  if (!allowedSteamIds.has(steamId)) {
    return NextResponse.redirect(getAppUrl("/sign-in?error=test-account"));
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      id: true,
      steamId: true,
      discordUsername: true,
      profileName: true,
      avatarUrl: true,
      deadlockRank: true,
      deadlockRankBadgeLevel: true,
      memberships: {
        select: {
          team: {
            select: {
              slug: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.redirect(getAppUrl("/sign-in?error=test-seed"));
  }

  const session = await getSession();
  session.authReturnTo = undefined;
  session.user = {
    id: user.id,
    steamId: user.steamId,
    discordUsername: user.discordUsername,
    profileName: user.profileName,
    avatarUrl: user.avatarUrl,
    deadlockRank: user.deadlockRank,
    deadlockRankBadgeLevel: user.deadlockRankBadgeLevel,
  };
  await session.save();

  const teamSlug = user.memberships[0]?.team.slug;
  return NextResponse.redirect(getAppUrl(returnTo ?? (teamSlug ? `/teams?team=${teamSlug}` : "/teams")));
}

