import type { User } from "@prisma/client";
import {
  averageDeadlockBadgeLevels,
  fetchDeadlockRank,
  formatDeadlockRank,
  isDeadlockRankFresh,
} from "@/lib/deadlock";
import { prisma } from "@/lib/prisma";

type RankableUser = Pick<
  User,
  | "id"
  | "steamId"
  | "deadlockRank"
  | "deadlockRankTier"
  | "deadlockRankSubrank"
  | "deadlockRankBadgeLevel"
  | "deadlockRankFetchedAt"
>;

function userRankData(rank: Awaited<ReturnType<typeof fetchDeadlockRank>>) {
  if (!rank) {
    return null;
  }

  return {
    deadlockRank: rank.rank,
    deadlockRankTier: rank.tier,
    deadlockRankSubrank: rank.subrank,
    deadlockRankBadgeLevel: rank.badgeLevel,
    deadlockRankFetchedAt: rank.fetchedAt,
  };
}

export async function syncDeadlockRankForUser(user: RankableUser) {
  if (isDeadlockRankFresh(user.deadlockRankFetchedAt)) {
    return user;
  }

  const rank = await fetchDeadlockRank(user.steamId);
  const data = userRankData(rank);

  if (!data) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data,
  });
}

export async function recalculateTeamRank(teamId: string) {
  const memberships = await prisma.teamMembership.findMany({
    where: { teamId },
    select: {
      user: {
        select: {
          deadlockRankBadgeLevel: true,
        },
      },
    },
  });
  const averageBadgeLevel = averageDeadlockBadgeLevels(
    memberships.map((membership) => membership.user.deadlockRankBadgeLevel),
  );
  const primaryRank = formatDeadlockRank(averageBadgeLevel);

  return prisma.team.update({
    where: { id: teamId },
    data: {
      primaryRank,
      primaryRankBadgeLevel: averageBadgeLevel,
      primaryRankUpdatedAt: new Date(),
    },
  });
}

export async function recalculateTeamsForUser(userId: string) {
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    select: { teamId: true },
  });

  await Promise.all(memberships.map((membership) => recalculateTeamRank(membership.teamId)));
}
