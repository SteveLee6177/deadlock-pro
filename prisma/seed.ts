import {
  BroadcastStatus,
  MembershipRole,
  PrismaClient,
  ScheduleEventType,
  ScrimAvailabilityStatus,
  ScrimMatchStatus,
  ScrimRequestStatus,
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
  await prisma.notification.deleteMany();
  await prisma.scrimMessage.deleteMany();
  await prisma.scrimConversation.deleteMany();
  await prisma.scrim.deleteMany();
  await prisma.scrimBookingRequest.deleteMany();
  await prisma.scrimAvailabilityBlock.deleteMany();
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
        region: "NA",
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
        region: "NA",
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
        region: "EU",
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
        region: "NA",
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
      region: "NA",
      focus: "Disciplined macro with nightly VOD blocks.",
      primaryRank: "Phantom",
      description:
        "A growth-focused Deadlock roster for players who want structured practice, film review, and reliable scrim blocks.",
      recruiting: true,
      openRoles: ["Position 2 (Soft carry)", "Coach"],
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
      region: "NA",
      focus: "Fast tempo fights and early tower pressure.",
      primaryRank: "Oracle",
      description:
        "Midwest scrim squad building a consistent tournament pipeline through Faceit weeklies and community invitationals.",
      recruiting: true,
      openRoles: ["Position 4 (Frontline)", "Analyst"],
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
      region: "EU",
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
      region: "NA",
      wantedRank: "Oracle+",
      notes: "Looking for comms-focused sets with 10 minute feedback after each map.",
      startsAt: hoursFromNow(8),
    },
  });

  const chronoshiftOpenBlock = await prisma.scrimAvailabilityBlock.create({
    data: {
      teamId: chronoshift.id,
      createdByUserId: maya.id,
      status: ScrimAvailabilityStatus.PENDING,
      region: chronoshift.region,
      startTime: hoursFromNow(26),
      endTime: hoursFromNow(29),
      notes: "Bo3 preferred with a short reset between maps.",
    },
  });

  await prisma.scrimBookingRequest.create({
    data: {
      availabilityBlockId: chronoshiftOpenBlock.id,
      requestingTeamId: harborNine.id,
      receivingTeamId: chronoshift.id,
      requestedByUserId: jordan.id,
      status: ScrimRequestStatus.PENDING,
      message: "Happy to run tempo-focused sets and share notes after map two.",
    },
  });

  const harborBookedBlock = await prisma.scrimAvailabilityBlock.create({
    data: {
      teamId: harborNine.id,
      createdByUserId: jordan.id,
      status: ScrimAvailabilityStatus.BOOKED,
      region: harborNine.region,
      startTime: hoursFromNow(54),
      endTime: hoursFromNow(57),
      notes: "Confirmed lobby block.",
    },
  });

  await prisma.scrim.create({
    data: {
      teamAId: harborNine.id,
      teamBId: chronoshift.id,
      availabilityBlockId: harborBookedBlock.id,
      startTime: hoursFromNow(54),
      endTime: hoursFromNow(57),
      status: ScrimMatchStatus.CONFIRMED,
      notes: "Server host rotates after each map.",
    },
  });

  await prisma.scrimAvailabilityBlock.createMany({
    data: [
      {
        teamId: glasshouse.id,
        createdByUserId: casey.id,
        status: ScrimAvailabilityStatus.OPEN,
        region: glasshouse.region,
        startTime: hoursFromNow(36),
        endTime: hoursFromNow(39),
        notes: "Looking for Archon to Phantom teams for execution practice.",
      },
      {
        teamId: chronoshift.id,
        createdByUserId: maya.id,
        status: ScrimAvailabilityStatus.OPEN,
        region: chronoshift.region,
        startTime: hoursFromNow(78),
        endTime: hoursFromNow(81),
        notes: "Macro review focus, Bo3 or Bo5.",
      },
    ],
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
        location: "Discord / NA",
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
      region: "NA",
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
      region: "EU",
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
