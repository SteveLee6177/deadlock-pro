import { NextRequest, NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { fetchDeadlockRank } from "@/lib/deadlock";
import { getAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSteamProfileSummary, verifySteamResponse } from "@/lib/steam";
import { recalculateTeamsForUser } from "@/lib/team-ranks";

export const runtime = "nodejs";

function addDiscordPrompt(path: string) {
  const [pathAndSearch, hash = ""] = path.split("#", 2);
  const separator = pathAndSearch.includes("?") ? "&" : "?";

  return `${pathAndSearch}${separator}discord=1${hash ? `#${hash}` : ""}`;
}

export async function GET(request: NextRequest) {
  try {
    const steamId = await verifySteamResponse(request.url);

    if (!steamId) {
      return NextResponse.redirect(getAppUrl("/sign-in?error=verification"));
    }

    const [profile, rank] = await Promise.all([
      getSteamProfileSummary(steamId).catch((error: unknown) => {
        console.error("Steam profile lookup failed", error);
        return null;
      }),
      fetchDeadlockRank(steamId).catch((error: unknown) => {
        console.error("Deadlock rank lookup failed", error);
        return null;
      }),
    ]);

    const session = await getSession();
    let postAuthTeamSlug: string | null = null;
    let shouldPromptForDiscord = false;

    if (await canUseDatabase()) {
      const existingUser = await prisma.user.findUnique({
        where: { steamId },
        select: { discordUsername: true },
      });
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
      const membership = await prisma.teamMembership.findFirst({
        where: { userId: user.id },
        select: {
          team: {
            select: { slug: true },
          },
        },
        orderBy: [
          { role: "asc" },
          { joinedAt: "asc" },
        ],
      });

      if (rank) {
        await recalculateTeamsForUser(user.id);
      }

      postAuthTeamSlug = membership?.team.slug ?? null;
      shouldPromptForDiscord = !existingUser && !user.discordUsername;
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
    const destination =
      returnTo && returnTo !== "/dashboard"
        ? returnTo
        : postAuthTeamSlug
          ? `/teams?team=${encodeURIComponent(postAuthTeamSlug)}`
          : "/teams";

    return NextResponse.redirect(
      getAppUrl(shouldPromptForDiscord ? addDiscordPrompt(destination) : destination),
    );
  } catch (error) {
    console.error("Steam auth callback failed", error);
    return NextResponse.redirect(getAppUrl("/sign-in?error=steam-auth"));
  }
}
