import {
  BroadcastStatus,
  MembershipRole,
  PrismaClient,
  ScheduleEventType,
  ScrimStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.broadcast.deleteMany();
  await prisma.tournamentEntry.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.scrimRequest.deleteMany();
  await prisma.teamApplication.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const [maya, jordan, casey, neo] = await Promise.all([
    prisma.user.create({
      data: {
        steamId: "76561198000000001",
        profileName: "Maya Voltage",
        avatarUrl: "https://avatars.fastly.steamstatic.com/0.jpg",
        headline: "IGL looking to scrim four nights a week.",
        region: "NA East",
        deadlockRank: "Phantom",
        deadlockRankTier: 6,
        isLFT: true,
      },
    }),
    prisma.user.create({
      data: {
        steamId: "76561198000000002",
        profileName: "Jordan Harbor",
        avatarUrl: "https://avatars.fastly.steamstatic.com/1.jpg",
        headline: "Flex support and vod review junkie.",
        region: "NA Central",
        deadlockRank: "Oracle",
        deadlockRankTier: 5,
      },
    }),
    prisma.user.create({
      data: {
        steamId: "76561198000000003",
        profileName: "Casey Reverb",
        avatarUrl: "https://avatars.fastly.steamstatic.com/2.jpg",
        headline: "Initiator main, event organizer, and bracket gremlin.",
        region: "EU West",
        deadlockRank: "Archon",
        deadlockRankTier: 4,
      },
    }),
    prisma.user.create({
      data: {
        steamId: "76561198000000004",
        profileName: "Neo Drift",
        avatarUrl: "https://avatars.fastly.steamstatic.com/3.jpg",
        headline: "Aim-heavy duelist chasing weekly cups.",
        region: "NA West",
        deadlockRank: "Phantom",
        deadlockRankTier: 6,
      },
    }),
  ]);

  const chronoshift = await prisma.team.create({
    data: {
      slug: "chronoshift",
      name: "Chronoshift",
      tag: "CSH",
      region: "NA East",
      focus: "Disciplined macro with nightly VOD blocks.",
      primaryRank: "Phantom",
      description:
        "A growth-focused Deadlock roster for players who want structured practice, film review, and reliable scrim blocks.",
      recruiting: true,
      openRoles: ["Flex", "Coach"],
      ownerId: maya.id,
      memberships: {
        create: [
          { userId: maya.id, role: MembershipRole.OWNER },
          { userId: jordan.id, role: MembershipRole.PLAYER },
        ],
      },
    },
  });

  const harborNine = await prisma.team.create({
    data: {
      slug: "harbor-nine",
      name: "Harbor Nine",
      tag: "HB9",
      region: "NA Central",
      focus: "Fast tempo fights and early tower pressure.",
      primaryRank: "Oracle",
      description:
        "Midwest scrim squad building a consistent tournament pipeline through Faceit weeklies and community invitationals.",
      recruiting: true,
      openRoles: ["Anchor", "Analyst"],
      ownerId: jordan.id,
      memberships: {
        create: [
          { userId: jordan.id, role: MembershipRole.OWNER },
          { userId: neo.id, role: MembershipRole.CAPTAIN },
        ],
      },
    },
  });

  const glasshouse = await prisma.team.create({
    data: {
      slug: "glasshouse",
      name: "Glasshouse",
      tag: "GLS",
      region: "EU West",
      focus: "Execution-heavy set plays with weekend qualifiers.",
      primaryRank: "Archon",
      description:
        "EU roster running coordinated practice blocks with a strong emphasis on tournament-ready comms.",
      recruiting: false,
      openRoles: [],
      ownerId: casey.id,
      memberships: {
        create: [{ userId: casey.id, role: MembershipRole.OWNER }],
      },
    },
  });

  const scrim = await prisma.scrimRequest.create({
    data: {
      requesterTeamId: chronoshift.id,
      opponentTeamId: harborNine.id,
      createdById: maya.id,
      status: ScrimStatus.CONFIRMED,
      format: "Bo3",
      region: "NA East",
      wantedRank: "Oracle+",
      notes: "Looking for comms-focused sets with 10 minute feedback after each map.",
      startsAt: hoursFromNow(8),
    },
  });

  await prisma.scheduleEvent.createMany({
    data: [
      {
        teamId: chronoshift.id,
        scrimId: scrim.id,
        title: "Scrim vs Harbor Nine",
        type: ScheduleEventType.SCRIM,
        startsAt: hoursFromNow(8),
        endsAt: hoursFromNow(11),
        location: "Discord / NA East",
        notes: "Server host rotates each map.",
      },
      {
        teamId: chronoshift.id,
        title: "VOD Review Block",
        type: ScheduleEventType.REVIEW,
        startsAt: hoursFromNow(30),
        endsAt: hoursFromNow(32),
        location: "Notion + Discord",
        notes: "Focus on midgame rotations.",
      },
      {
        teamId: harborNine.id,
        title: "Aim & Micro Lab",
        type: ScheduleEventType.PRACTICE,
        startsAt: hoursFromNow(4),
        endsAt: hoursFromNow(6),
        location: "Private Lobby",
        notes: "Movement reps followed by duel drills.",
      },
      {
        teamId: glasshouse.id,
        title: "Qualifier Prep",
        type: ScheduleEventType.TOURNAMENT,
        startsAt: hoursFromNow(50),
        endsAt: hoursFromNow(54),
        location: "Faceit Check-In",
        notes: "Standby player on call.",
      },
    ],
  });

  const faceitWeekly = await prisma.tournament.create({
    data: {
      slug: "faceit-weekly",
      name: "Faceit Deadlock Weekly",
      organizer: "FACEIT",
      region: "North America",
      platform: "FACEIT",
      format: "Single Elimination Bo3",
      prizePool: "$750",
      entryRequirements: "Team captain must verify roster on FACEIT.",
      registrationUrl: "https://www.faceit.com/",
      startsAt: hoursFromNow(72),
      featured: true,
    },
  });

  const deathslam = await prisma.tournament.create({
    data: {
      slug: "death-slam-open",
      name: "Death Slam Open",
      organizer: "Death Slam",
      region: "Europe",
      platform: "External Bracket",
      format: "Swiss into Top 8",
      prizePool: "Community-funded",
      entryRequirements: "Public roster and Discord check-in required.",
      registrationUrl: "https://battlefy.com/",
      startsAt: hoursFromNow(110),
      featured: true,
    },
  });

  await prisma.tournamentEntry.createMany({
    data: [
      { tournamentId: faceitWeekly.id, teamId: chronoshift.id },
      { tournamentId: deathslam.id, teamId: glasshouse.id },
    ],
  });

  await prisma.broadcast.createMany({
    data: [
      {
        tournamentId: faceitWeekly.id,
        title: "Weekly Showcase Stream",
        channel: "twitchrivals",
        status: BroadcastStatus.LIVE,
        startsAt: hoursFromNow(-1),
      },
      {
        tournamentId: deathslam.id,
        title: "Death Slam Main Broadcast",
        channel: "beyondthesummit",
        status: BroadcastStatus.UPCOMING,
        startsAt: hoursFromNow(48),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
