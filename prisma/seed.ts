import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { localTestTeams } from "../src/lib/local-test-data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const teamsBySlug = new Map<string, { id: string; ownerId: string }>();

  await prisma.team.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "mock-", mode: "insensitive" } },
        { name: { startsWith: "Mock ", mode: "insensitive" } },
      ],
    },
  });

  for (const teamData of localTestTeams) {
    const players = await Promise.all(
      teamData.players.map((player) =>
        prisma.user.upsert({
          where: { steamId: player.steamId },
          update: {
            discordUsername: player.discordUsername,
            profileName: player.profileName,
            deadlockRank: player.deadlockRank,
            deadlockRankBadgeLevel: player.deadlockRankBadgeLevel,
          },
          create: {
            steamId: player.steamId,
            discordUsername: player.discordUsername,
            profileName: player.profileName,
            deadlockRank: player.deadlockRank,
            deadlockRankBadgeLevel: player.deadlockRankBadgeLevel,
          },
        }),
      ),
    );

    const owner = players[0];
    const team = await prisma.team.upsert({
      where: { slug: teamData.slug },
      update: {
        name: teamData.name,
        tag: teamData.tag,
        region: teamData.region,
        focus: teamData.focus,
        primaryRank: teamData.primaryRank,
        primaryRankBadgeLevel: teamData.primaryRankBadgeLevel,
        primaryRankUpdatedAt: new Date(),
        description: teamData.description,
        recruiting: true,
        openRoles: teamData.openRoles,
        ownerId: owner.id,
      },
      create: {
        slug: teamData.slug,
        name: teamData.name,
        tag: teamData.tag,
        region: teamData.region,
        focus: teamData.focus,
        primaryRank: teamData.primaryRank,
        primaryRankBadgeLevel: teamData.primaryRankBadgeLevel,
        primaryRankUpdatedAt: new Date(),
        description: teamData.description,
        recruiting: true,
        openRoles: teamData.openRoles,
        ownerId: owner.id,
      },
    });

    for (const [index, player] of teamData.players.entries()) {
      await prisma.teamMembership.upsert({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: players[index].id,
          },
        },
        update: { role: player.role },
        create: {
          teamId: team.id,
          userId: players[index].id,
          role: player.role,
        },
      });
    }

    teamsBySlug.set(teamData.slug, { id: team.id, ownerId: owner.id });
  }

  const testTeamIds = [...teamsBySlug.values()].map((team) => team.id);
  await prisma.$transaction([
    prisma.scrimMessage.deleteMany({
      where: {
        senderTeamId: { in: testTeamIds },
      },
    }),
    prisma.scrimConversation.deleteMany({
      where: {
        OR: [
          { bookingRequest: { requestingTeamId: { in: testTeamIds } } },
          { bookingRequest: { receivingTeamId: { in: testTeamIds } } },
          { scrim: { OR: [{ teamAId: { in: testTeamIds } }, { teamBId: { in: testTeamIds } }] } },
        ],
      },
    }),
    prisma.scrim.deleteMany({
      where: {
        OR: [{ teamAId: { in: testTeamIds } }, { teamBId: { in: testTeamIds } }],
      },
    }),
    prisma.scrimBookingRequest.deleteMany({
      where: {
        OR: [{ requestingTeamId: { in: testTeamIds } }, { receivingTeamId: { in: testTeamIds } }],
      },
    }),
    prisma.scrimAvailabilityBlock.deleteMany({
      where: { teamId: { in: testTeamIds } },
    }),
    prisma.scheduleEvent.deleteMany({
      where: { teamId: { in: testTeamIds } },
    }),
  ]);

  console.log(`Seeded ${localTestTeams.length} local test teams.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
