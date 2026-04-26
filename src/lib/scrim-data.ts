import { addDays, endOfDay, parseISO, startOfDay } from "date-fns";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { canUseDatabase } from "@/lib/database";
import { demoScrims } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
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
  };
}): ScrimAvailabilitySummary {
  return {
    id: block.id,
    teamId: block.teamId,
    teamSlug: block.team.slug,
    teamName: block.team.name,
    teamTag: block.team.tag,
    region: block.region,
    rank: block.team.primaryRank,
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
  };
  receivingTeam: {
    slug: string;
    name: string;
    region: string;
    primaryRank: string;
  };
}): ScrimRequestSummary {
  return {
    id: request.id,
    availabilityBlockId: request.availabilityBlockId,
    requestingTeamId: request.requestingTeamId,
    requestingTeamName: request.requestingTeam.name,
    requestingTeamSlug: request.requestingTeam.slug,
    requestingTeamRegion: request.requestingTeam.region,
    requestingTeamRank: request.requestingTeam.primaryRank,
    receivingTeamId: request.receivingTeamId,
    receivingTeamName: request.receivingTeam.name,
    receivingTeamSlug: request.receivingTeam.slug,
    receivingTeamRegion: request.receivingTeam.region,
    receivingTeamRank: request.receivingTeam.primaryRank,
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
}): ScrimMatchSummary {
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
  };
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
      region: scrim.region,
      rank: scrim.wantedRank,
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
    },
  });
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const options: ScrimTeamOption[] = [];

  for (const membership of membershipData.memberships) {
    const team = teamById.get(membership.teamId);

    if (team) {
      options.push({
        ...team,
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
            },
          },
        },
        orderBy: { startTime: "asc" },
        take: 30,
      }),
      prisma.scrimBookingRequest.findMany({
        where: {
          receivingTeamId: selectedTeam.id,
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
          startTime: { gte: now, lte: horizon },
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
  const mappedScrims = scrims.map(mapScrim);

  return {
    team: selectedTeam,
    teams,
    upcomingScrims: mappedScrims,
    availabilityBlocks: mappedAvailability,
    openBlocks,
    incomingRequests: mappedIncoming,
    outgoingRequests: mappedOutgoing,
    calendarEvents: buildCalendarEvents(
      selectedTeam.id,
      mappedAvailability,
      mappedIncoming,
      mappedOutgoing,
      mappedScrims,
    ),
  };
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
    },
  },
  receivingTeam: {
    select: {
      slug: true,
      name: true,
      region: true,
      primaryRank: true,
    },
  },
};

function buildCalendarEvents(
  teamId: string,
  availabilityBlocks: ScrimAvailabilitySummary[],
  incomingRequests: ScrimRequestSummary[],
  outgoingRequests: ScrimRequestSummary[],
  scrims: ScrimMatchSummary[],
): ScrimCalendarEvent[] {
  const requestEvents = [...incomingRequests, ...outgoingRequests]
    .filter((request) => request.status === "PENDING")
    .map((request) => ({
      id: request.id,
      kind: "request" as const,
      title:
        request.receivingTeamId === teamId
          ? `Pending vs ${request.requestingTeamName}`
          : `Requested ${request.receivingTeamName}`,
      startTime: request.startTime,
      endTime: request.endTime,
      status: request.status,
      notes: request.message,
      opponentName:
        request.receivingTeamId === teamId
          ? request.requestingTeamName
          : request.receivingTeamName,
    }));

  const availabilityEvents = availabilityBlocks.map((block) => ({
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

  return [...availabilityEvents, ...requestEvents, ...scrimEvents].sort(
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
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: 30,
    }),
    isMember
      ? prisma.scrimBookingRequest.findMany({
          where: { receivingTeamId: team.id },
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
            startTime: { gte: new Date() },
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
  const mappedScrims = scrims.map(mapScrim);

  const teamSummary: TeamSummary = {
    id: team.id,
    slug: team.slug,
    name: team.name,
    tag: team.tag,
    region: team.region,
    focus: team.focus,
    primaryRank: team.primaryRank,
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
    availabilityBlocks: mappedBlocks,
    incomingRequests: mappedIncoming,
    outgoingRequests: mappedOutgoing,
    upcomingScrims: mappedScrims,
    calendarEvents: buildCalendarEvents(
      team.id,
      mappedBlocks,
      mappedIncoming,
      mappedOutgoing,
      mappedScrims,
    ),
  };
}
