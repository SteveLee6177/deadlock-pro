import { addDays, endOfDay, parseISO, startOfDay } from "date-fns";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { canUseDatabase } from "@/lib/database";
import { demoScrims } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import { normalizeRegion } from "@/lib/regions";
import { isScrimManagerRole } from "@/lib/scrim-permissions";
import type {
  ScrimAvailabilitySummary,
  ScrimCalendarEvent,
  ScrimMatchSummary,
  ScrimRequestSummary,
  ScrimTeamOption,
  ScrimWorkspace,
  TeamSummary,
} from "@/lib/types";

export type ScrimDiscoveryFilters = {
  date?: string;
  timeFrom?: string;
  timeTo?: string;
  region?: string;
  rank?: string;
  teamStatus?: string;
};

function mapAvailability(block: {
  id: string;
  teamId: string;
  startTime: Date;
  endTime: Date;
  region: string;
  notes: string | null;
  status: string;
  team: {
    slug: string;
    name: string;
    tag: string;
    primaryRank: string;
    primaryRankBadgeLevel: number | null;
  };
}): ScrimAvailabilitySummary {
  return {
    id: block.id,
    teamId: block.teamId,
    teamSlug: block.team.slug,
    teamName: block.team.name,
    teamTag: block.team.tag,
    region: normalizeRegion(block.region),
    rank: block.team.primaryRank,
    rankBadgeLevel: block.team.primaryRankBadgeLevel,
    startTime: block.startTime.toISOString(),
    endTime: block.endTime.toISOString(),
    notes: block.notes,
    status: block.status,
  };
}

function mapRequest(request: {
  id: string;
  availabilityBlockId: string;
  requestingTeamId: string;
  receivingTeamId: string;
  message: string | null;
  status: string;
  createdAt: Date;
  availabilityBlock: {
    startTime: Date;
    endTime: Date;
  };
  requestingTeam: {
    slug: string;
    name: string;
    region: string;
    primaryRank: string;
    primaryRankBadgeLevel: number | null;
  };
  receivingTeam: {
    slug: string;
    name: string;
    region: string;
    primaryRank: string;
    primaryRankBadgeLevel: number | null;
  };
}): ScrimRequestSummary {
  return {
    id: request.id,
    availabilityBlockId: request.availabilityBlockId,
    requestingTeamId: request.requestingTeamId,
    requestingTeamName: request.requestingTeam.name,
    requestingTeamSlug: request.requestingTeam.slug,
    requestingTeamRegion: normalizeRegion(request.requestingTeam.region),
    requestingTeamRank: request.requestingTeam.primaryRank,
    requestingTeamRankBadgeLevel: request.requestingTeam.primaryRankBadgeLevel,
    receivingTeamId: request.receivingTeamId,
    receivingTeamName: request.receivingTeam.name,
    receivingTeamSlug: request.receivingTeam.slug,
    receivingTeamRegion: normalizeRegion(request.receivingTeam.region),
    receivingTeamRank: request.receivingTeam.primaryRank,
    receivingTeamRankBadgeLevel: request.receivingTeam.primaryRankBadgeLevel,
    startTime: request.availabilityBlock.startTime.toISOString(),
    endTime: request.availabilityBlock.endTime.toISOString(),
    message: request.message,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  };
}

function mapScrim(scrim: {
  id: string;
  teamAId: string;
  teamBId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  teamA: { name: string };
  teamB: { name: string };
}, unreadChatCount = 0): ScrimMatchSummary {
  return {
    id: scrim.id,
    teamAId: scrim.teamAId,
    teamAName: scrim.teamA.name,
    teamBId: scrim.teamBId,
    teamBName: scrim.teamB.name,
    startTime: scrim.startTime.toISOString(),
    endTime: scrim.endTime.toISOString(),
    status: scrim.status,
    notes: scrim.notes,
    unreadChatCount,
  };
}

function availabilityOverlapsScrim(
  block: ScrimAvailabilitySummary,
  scrims: ScrimMatchSummary[],
) {
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);

  return scrims.some((scrim) => {
    const scrimStart = new Date(scrim.startTime);
    const scrimEnd = new Date(scrim.endTime);

    return scrimStart < blockEnd && scrimEnd > blockStart;
  });
}

function filterVisibleAvailability(
  blocks: ScrimAvailabilitySummary[],
  scrims: ScrimMatchSummary[],
) {
  return blocks.filter(
    (block) => block.status !== "BOOKED" && !availabilityOverlapsScrim(block, scrims),
  );
}

function demoOpenBlocks(): ScrimAvailabilitySummary[] {
  return demoScrims.map((scrim) => {
    const startTime = new Date(scrim.startsAt);
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

    return {
      id: scrim.id,
      teamId: scrim.requesterTeamId,
      teamSlug: scrim.requesterTeamName.toLowerCase().replace(/\s+/g, "-"),
      teamName: scrim.requesterTeamName,
      teamTag: scrim.requesterTag,
      region: normalizeRegion(scrim.region),
      rank: scrim.wantedRank,
      rankBadgeLevel: null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: scrim.notes,
      status: scrim.status === "OPEN" ? "OPEN" : "PENDING",
    };
  });
}

export async function getCurrentScrimTeams(): Promise<ScrimTeamOption[]> {
  noStore();

  if (!(await canUseDatabase())) {
    return [];
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData || membershipData.memberships.length === 0) {
    return [];
  }

  const teamIds = membershipData.memberships.map((membership) => membership.teamId);
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true,
      slug: true,
      name: true,
      tag: true,
      region: true,
      primaryRank: true,
      primaryRankBadgeLevel: true,
    },
  });
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const options: ScrimTeamOption[] = [];

  for (const membership of membershipData.memberships) {
    const team = teamById.get(membership.teamId);

    if (team) {
      options.push({
        ...team,
        region: normalizeRegion(team.region),
        role: membership.role,
        canManageScrims: isScrimManagerRole(membership.role),
      });
    }
  }

  return options;
}

function getDateWindow(filters?: ScrimDiscoveryFilters) {
  if (!filters?.date) {
    return {
      gte: new Date(),
    };
  }

  const day = parseISO(filters.date);
  return {
    gte: startOfDay(day),
    lte: endOfDay(day),
  };
}

export async function getOpenAvailabilityBlocks(
  filters?: ScrimDiscoveryFilters,
): Promise<ScrimAvailabilitySummary[]> {
  noStore();

  if (!(await canUseDatabase())) {
    return demoOpenBlocks();
  }

  const blocks = await prisma.scrimAvailabilityBlock.findMany({
    where: {
      status: "OPEN",
      startTime: getDateWindow(filters),
      region:
        filters?.region && filters.region !== "Any region"
          ? { contains: filters.region, mode: "insensitive" }
          : undefined,
      team: {
        primaryRank:
          filters?.rank && filters.rank !== "Any rank"
            ? { contains: filters.rank, mode: "insensitive" }
            : undefined,
        recruiting:
          filters?.teamStatus === "Recruiting"
            ? true
            : filters?.teamStatus === "Closed"
              ? false
              : undefined,
      },
    },
    include: {
      team: {
        select: {
          slug: true,
          name: true,
          tag: true,
          primaryRank: true,
          primaryRankBadgeLevel: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
    take: 80,
  });

  return blocks
    .filter((block) => {
      if (!filters?.timeFrom && !filters?.timeTo) {
        return true;
      }

      const hours = block.startTime.getHours();
      const minutes = block.startTime.getMinutes();
      const timeValue = hours * 60 + minutes;
      const fromValue = filters.timeFrom ? toMinutes(filters.timeFrom) : 0;
      const toValue = filters.timeTo ? toMinutes(filters.timeTo) : 24 * 60 - 1;

      return timeValue >= fromValue && timeValue <= toValue;
    })
    .map(mapAvailability);
}

export async function removeDeclinedMatchupBlocks(
  blocks: ScrimAvailabilitySummary[],
  teamIds: string[],
) {
  noStore();

  if (blocks.length === 0 || teamIds.length === 0 || !(await canUseDatabase())) {
    return blocks;
  }

  const ownTeamIds = new Set(teamIds);
  const otherTeamIds = [...new Set(blocks.map((block) => block.teamId))];
  const declinedRequests = await prisma.scrimBookingRequest.findMany({
    where: {
      status: "DECLINED",
      OR: [
        {
          requestingTeamId: { in: teamIds },
          receivingTeamId: { in: otherTeamIds },
        },
        {
          requestingTeamId: { in: otherTeamIds },
          receivingTeamId: { in: teamIds },
        },
      ],
    },
    include: {
      availabilityBlock: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  if (declinedRequests.length === 0) {
    return blocks;
  }

  return blocks.filter((block) => {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);

    return !declinedRequests.some((request) => {
      const requestStart = request.availabilityBlock.startTime;
      const requestEnd = request.availabilityBlock.endTime;
      const teamsMatch =
        (ownTeamIds.has(request.requestingTeamId) && request.receivingTeamId === block.teamId) ||
        (ownTeamIds.has(request.receivingTeamId) && request.requestingTeamId === block.teamId);
      const timesOverlap = requestStart < blockEnd && requestEnd > blockStart;

      return teamsMatch && timesOverlap;
    });
  });
}

function toMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export async function getScrimWorkspace(preferredSlug?: string): Promise<ScrimWorkspace> {
  noStore();

  const teams = await getCurrentScrimTeams();
  const selectedTeam =
    teams.find((team) => team.slug === preferredSlug) ??
    teams.find((team) => team.canManageScrims) ??
    teams[0] ??
    null;

  const emptyWorkspace: ScrimWorkspace = {
    team: selectedTeam,
    teams,
    upcomingScrims: [],
    availabilityBlocks: [],
    openBlocks: await getOpenAvailabilityBlocks(),
    incomingRequests: [],
    outgoingRequests: [],
    calendarEvents: [],
  };

  if (!selectedTeam || !(await canUseDatabase())) {
    return emptyWorkspace;
  }

  const membershipData = await getCurrentUserMemberships();
  const now = new Date();
  const horizon = addDays(now, 45);

  const [availabilityBlocks, incomingRequests, outgoingRequests, scrims, openBlocks] =
    await Promise.all([
      prisma.scrimAvailabilityBlock.findMany({
        where: {
          teamId: selectedTeam.id,
          endTime: { gte: now },
          status: { not: "CANCELLED" },
        },
        include: {
          team: {
            select: {
              slug: true,
              name: true,
              tag: true,
              primaryRank: true,
              primaryRankBadgeLevel: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
        take: 30,
      }),
      prisma.scrimBookingRequest.findMany({
        where: {
          receivingTeamId: selectedTeam.id,
          status: "PENDING",
        },
        include: requestIncludes,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 20,
      }),
      prisma.scrimBookingRequest.findMany({
        where: {
          requestingTeamId: selectedTeam.id,
        },
        include: requestIncludes,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 20,
      }),
      prisma.scrim.findMany({
        where: {
          OR: [{ teamAId: selectedTeam.id }, { teamBId: selectedTeam.id }],
          endTime: { gte: now },
          startTime: { lte: horizon },
          status: "CONFIRMED",
        },
        include: {
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
        take: 20,
      }),
      getOpenAvailabilityBlocks(),
    ]);

  const mappedAvailability = availabilityBlocks.map(mapAvailability);
  const mappedIncoming = incomingRequests.map(mapRequest);
  const mappedOutgoing = outgoingRequests.map(mapRequest);
  const unreadChatCounts = membershipData
    ? await getUnreadConfirmedScrimChatCounts(scrims, membershipData.user.id)
    : new Map<string, number>();
  const mappedScrims = scrims.map((scrim) => mapScrim(scrim, unreadChatCounts.get(scrim.id) ?? 0));
  const visibleAvailability = filterVisibleAvailability(mappedAvailability, mappedScrims);

  return {
    team: selectedTeam,
    teams,
    upcomingScrims: mappedScrims,
    availabilityBlocks: visibleAvailability,
    openBlocks,
    incomingRequests: mappedIncoming,
    outgoingRequests: mappedOutgoing,
    calendarEvents: buildCalendarEvents(
      selectedTeam.id,
      visibleAvailability,
      mappedIncoming,
      mappedOutgoing,
      mappedScrims,
    ),
  };
}

async function getUnreadConfirmedScrimChatCounts(
  scrims: Array<{
    id: string;
    availabilityBlockId: string;
  }>,
  userId: string,
) {
  if (scrims.length === 0) {
    return new Map<string, number>();
  }

  const scrimIds = scrims.map((scrim) => scrim.id);
  const availabilityBlockIds = scrims.map((scrim) => scrim.availabilityBlockId);
  const conversations = await prisma.scrimConversation.findMany({
    where: {
      OR: [
        { scrimId: { in: scrimIds } },
        {
          bookingRequest: {
            status: "ACCEPTED",
            availabilityBlockId: { in: availabilityBlockIds },
          },
        },
      ],
    },
    select: {
      id: true,
      scrimId: true,
      bookingRequest: {
        select: {
          availabilityBlockId: true,
        },
      },
    },
  });
  const scrimIdByBlockId = new Map(
    scrims.map((scrim) => [scrim.availabilityBlockId, scrim.id]),
  );
  const conversationIdToScrimId = new Map<string, string>();

  for (const conversation of conversations) {
    const scrimId =
      conversation.scrimId ??
      (conversation.bookingRequest
        ? scrimIdByBlockId.get(conversation.bookingRequest.availabilityBlockId)
        : undefined);

    if (scrimId) {
      conversationIdToScrimId.set(conversation.id, scrimId);
    }
  }

  if (conversationIdToScrimId.size === 0) {
    return new Map<string, number>();
  }

  const notifications = await prisma.notification.groupBy({
    by: ["relatedEntityId"],
    where: {
      userId,
      readAt: null,
      type: "SCRIM_CHAT",
      relatedEntityId: { in: [...conversationIdToScrimId.keys()] },
    },
    _count: { _all: true },
  });
  const counts = new Map<string, number>();

  for (const notification of notifications) {
    const conversationId = notification.relatedEntityId;
    const scrimId = conversationId ? conversationIdToScrimId.get(conversationId) : null;

    if (scrimId) {
      counts.set(scrimId, (counts.get(scrimId) ?? 0) + notification._count._all);
    }
  }

  return counts;
}

const requestIncludes = {
  availabilityBlock: {
    select: {
      startTime: true,
      endTime: true,
    },
  },
  requestingTeam: {
    select: {
      slug: true,
      name: true,
      region: true,
      primaryRank: true,
      primaryRankBadgeLevel: true,
    },
  },
  receivingTeam: {
    select: {
      slug: true,
      name: true,
      region: true,
      primaryRank: true,
      primaryRankBadgeLevel: true,
    },
  },
};

function buildCalendarEvents(
  teamId: string,
  availabilityBlocks: ScrimAvailabilitySummary[],
  _incomingRequests: ScrimRequestSummary[],
  _outgoingRequests: ScrimRequestSummary[],
  scrims: ScrimMatchSummary[],
): ScrimCalendarEvent[] {
  const availabilityEvents = availabilityBlocks
    .map((block) => ({
      id: block.id,
      kind: "availability" as const,
      title: "Open availability",
      startTime: block.startTime,
      endTime: block.endTime,
      status: block.status,
      notes: block.notes,
      opponentName: null,
    }));

  const scrimEvents = scrims.map((scrim) => ({
    id: scrim.id,
    kind: "scrim" as const,
    title: `Scrim vs ${scrim.teamAId === teamId ? scrim.teamBName : scrim.teamAName}`,
    startTime: scrim.startTime,
    endTime: scrim.endTime,
    status: scrim.status,
    notes: scrim.notes,
    opponentName: scrim.teamAId === teamId ? scrim.teamBName : scrim.teamAName,
  }));

  return [...availabilityEvents, ...scrimEvents].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export async function getTeamScrimPage(slug: string, userId?: string | null) {
  noStore();

  if (!(await canUseDatabase())) {
    return null;
  }

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: userId ? { userId } : undefined,
        select: { role: true, userId: true },
      },
    },
  });

  if (!team) {
    return null;
  }

  const membership = team.memberships[0];
  const isMember = Boolean(membership);
  const canManage = isScrimManagerRole(membership?.role);
  const [blocks, incomingRequests, outgoingRequests, scrims] = await Promise.all([
    prisma.scrimAvailabilityBlock.findMany({
      where: {
        teamId: team.id,
        endTime: { gte: new Date() },
        status: isMember ? { not: "CANCELLED" } : "OPEN",
      },
      include: {
        team: {
          select: {
            slug: true,
            name: true,
            tag: true,
            primaryRank: true,
            primaryRankBadgeLevel: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: 30,
    }),
    isMember
      ? prisma.scrimBookingRequest.findMany({
          where: { receivingTeamId: team.id, status: "PENDING" },
          include: requestIncludes,
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 12,
        })
      : [],
    isMember
      ? prisma.scrimBookingRequest.findMany({
          where: { requestingTeamId: team.id },
          include: requestIncludes,
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 12,
        })
      : [],
    isMember
      ? prisma.scrim.findMany({
          where: {
            OR: [{ teamAId: team.id }, { teamBId: team.id }],
            endTime: { gte: new Date() },
            status: "CONFIRMED",
          },
          include: {
            teamA: { select: { name: true } },
            teamB: { select: { name: true } },
          },
          orderBy: { startTime: "asc" },
          take: 20,
        })
      : [],
  ]);

  const mappedBlocks = blocks.map(mapAvailability);
  const mappedIncoming = incomingRequests.map(mapRequest);
  const mappedOutgoing = outgoingRequests.map(mapRequest);
  const unreadChatCounts =
    userId && isMember
      ? await getUnreadConfirmedScrimChatCounts(scrims, userId)
      : new Map<string, number>();
  const mappedScrims = scrims.map((scrim) => mapScrim(scrim, unreadChatCounts.get(scrim.id) ?? 0));
  const visibleAvailability = filterVisibleAvailability(mappedBlocks, mappedScrims);

  const teamSummary: TeamSummary = {
    id: team.id,
    slug: team.slug,
    name: team.name,
    tag: team.tag,
    region: normalizeRegion(team.region),
    focus: team.focus,
    primaryRank: team.primaryRank,
    primaryRankBadgeLevel: team.primaryRankBadgeLevel,
    description: team.description,
    recruiting: team.recruiting,
    openRoles: team.openRoles,
    memberCount: 0,
    availability: mappedBlocks[0] ? "Open scrim blocks" : "No open blocks",
  };

  return {
    team: teamSummary,
    isMember,
    canManage,
    role: membership?.role ?? null,
    availabilityBlocks: visibleAvailability,
    incomingRequests: mappedIncoming,
    outgoingRequests: mappedOutgoing,
    upcomingScrims: mappedScrims,
    calendarEvents: buildCalendarEvents(
      team.id,
      visibleAvailability,
      mappedIncoming,
      mappedOutgoing,
      mappedScrims,
    ),
  };
}
