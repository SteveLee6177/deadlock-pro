import { formatDistanceToNow } from "date-fns";
import { unstable_noStore as noStore } from "next/cache";
import { demoBroadcasts, demoDashboardData, demoSchedule, demoScrims, demoTeamProfiles, demoTeams, demoTournaments } from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/auth";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { normalizeRegion } from "@/lib/regions";
import {
  canReapplyToDeclinedTeamApplication,
  canStoreTeamApplicationDeclinedAt,
} from "@/lib/team-applications";
import { getTeamInviteUrl, isActiveTeamInvite } from "@/lib/team-invites";
import type {
  BroadcastCard,
  DashboardData,
  OpenScrim,
  PlayerApplicationSummary,
  ScheduleFeedEvent,
  TeamApplicationSummary,
  TeamProfile,
  TeamSummary,
  TournamentCard,
  UserTeamWorkspace,
  UserTeamOption,
} from "@/lib/types";

async function withFallback<T>(query: () => Promise<T>, fallback: T) {
  if (!(await canUseDatabase())) {
    return fallback;
  }

  try {
    return await query();
  } catch {
    return fallback;
  }
}

function mapTeam(team: {
  id: string;
  slug: string;
  name: string;
  tag: string;
  region: string;
  focus: string;
  primaryRank: string;
  primaryRankBadgeLevel: number | null;
  description: string;
  recruiting: boolean;
  openRoles: string[];
  memberships: Array<{ userId?: string }>;
  scheduleEvents?: Array<{ startsAt: Date }>;
  applications?: Array<{ status: string; createdAt: Date; declinedAt?: Date | null }>;
}, currentUserId?: string | null): TeamSummary {
  const currentUserApplication = team.applications?.[0];
  const currentUserIsMember = Boolean(
    currentUserId && team.memberships.some((membership) => membership.userId === currentUserId),
  );
  const applicationCooldown = currentUserApplication
    ? {
        createdAt: currentUserApplication.createdAt,
        declinedAt: currentUserApplication.declinedAt ?? null,
      }
    : null;
  let currentUserCanApply = !currentUserApplication;

  if (currentUserApplication?.status === "DECLINED" && applicationCooldown) {
    currentUserCanApply = canReapplyToDeclinedTeamApplication(applicationCooldown);
  }

  return {
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
    memberCount: team.memberships.length,
    availability: team.scheduleEvents?.[0]
      ? `Next block ${formatDistanceToNow(team.scheduleEvents[0].startsAt, { addSuffix: true })}`
      : "Schedule open",
    currentUserApplicationStatus: currentUserApplication?.status ?? null,
    currentUserCanApply: currentUserCanApply && !currentUserIsMember,
    currentUserIsMember,
  };
}

function mapScheduleEvent(event: {
  id: string;
  title: string;
  type: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  notes: string | null;
  team: { id: string; name: string };
}): ScheduleFeedEvent {
  return {
    id: event.id,
    teamId: event.team.id,
    teamName: event.team.name,
    title: event.title,
    type: event.type,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    location: event.location,
    notes: event.notes,
  };
}

function mapScrimRequest(scrim: {
  id: string;
  requesterTeamId: string;
  region: string;
  format: string;
  wantedRank: string;
  notes: string | null;
  startsAt: Date;
  status: string;
  requesterTeam: { name: string; tag: string };
}): OpenScrim {
  return {
    id: scrim.id,
    requesterTeamId: scrim.requesterTeamId,
    requesterTeamName: scrim.requesterTeam.name,
    requesterTag: scrim.requesterTeam.tag,
    region: normalizeRegion(scrim.region),
    format: scrim.format,
    wantedRank: scrim.wantedRank,
    notes: scrim.notes,
    startsAt: scrim.startsAt.toISOString(),
    status: scrim.status,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  noStore();
  const user = await getCurrentUser();

  const [featuredTeams, openScrims, schedule, tournaments, broadcasts] = await Promise.all([
    getFeaturedTeams(),
    getOpenScrims(),
    getScheduleFeed(),
    getTournamentCards(),
    getBroadcastCards(),
  ]);

  return {
    user,
    featuredTeams,
    openScrims,
    schedule,
    tournaments,
    broadcasts,
    stats: demoDashboardData.stats,
  };
}

export async function getFeaturedTeams(): Promise<TeamSummary[]> {
  noStore();

  return withFallback(
    async () => {
      const teams = await prisma.team.findMany({
        include: {
          memberships: true,
          scheduleEvents: {
            orderBy: { startsAt: "asc" },
            take: 1,
            where: { endsAt: { gte: new Date() } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

      return teams.map((team) => mapTeam(team));
    },
    demoTeams,
  );
}

export async function getTeamsDirectory(): Promise<TeamSummary[]> {
  noStore();

  return withFallback(
    async () => {
      const [user, includeDeclinedAt] = await Promise.all([
        getCurrentUser(),
        canStoreTeamApplicationDeclinedAt(),
      ]);
      const teams = await prisma.team.findMany({
        include: {
          applications: {
            where: {
              user: {
                steamId: user?.steamId ?? "__signed_out__",
              },
            },
            select: includeDeclinedAt
              ? { status: true, createdAt: true, declinedAt: true }
              : { status: true, createdAt: true },
            take: 1,
          },
          memberships: true,
          scheduleEvents: {
            orderBy: { startsAt: "asc" },
            take: 1,
            where: { endsAt: { gte: new Date() } },
          },
        },
        orderBy: [{ recruiting: "desc" }, { createdAt: "desc" }],
      });

      return teams.map((team) => mapTeam(team, user?.id));
    },
    demoTeams,
  );
}

export async function getCurrentUserTeams(): Promise<UserTeamOption[]> {
  noStore();

  if (!(await canUseDatabase())) {
    return [];
  }

  try {
    const membershipData = await getCurrentUserMemberships();

    if (!membershipData) {
      return [];
    }

    return membershipData.memberships.map((membership) => ({
      id: membership.team.id,
      slug: membership.team.slug,
      name: membership.team.name,
      tag: membership.team.tag,
      role: membership.role,
    }));
  } catch {
    return [];
  }
}

export async function getCurrentUserApplications(): Promise<PlayerApplicationSummary[]> {
  noStore();

  if (!(await canUseDatabase())) {
    return [];
  }

  try {
    const membershipData = await getCurrentUserMemberships();

    if (!membershipData) {
      return [];
    }

    const applications = await prisma.teamApplication.findMany({
      where: { userId: membershipData.user.id },
      include: {
        team: {
          select: {
            id: true,
            slug: true,
            name: true,
            region: true,
            primaryRank: true,
            primaryRankBadgeLevel: true,
            recruiting: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return applications.map((application) => ({
      id: application.id,
      status: application.status,
      message: application.message,
      createdAt: application.createdAt.toISOString(),
      team: {
        ...application.team,
        region: normalizeRegion(application.team.region),
      },
    }));
  } catch {
    return [];
  }
}

export async function getCurrentUserTeamWorkspace(
  preferredSlug?: string,
): Promise<UserTeamWorkspace | null> {
  noStore();

  if (!(await canUseDatabase())) {
    return null;
  }

  try {
    const membershipData = await getCurrentUserMemberships();

    if (!membershipData || membershipData.memberships.length === 0) {
      return null;
    }

    const selectedMembership =
      membershipData.memberships.find((membership) => membership.team.slug === preferredSlug) ??
      membershipData.memberships.find((membership) => membership.role === "OWNER") ??
      membershipData.memberships[0];

    const team = await prisma.team.findUnique({
      where: { id: selectedMembership.teamId },
      include: {
        applications: {
          where: { status: "PENDING" },
          select: {
            id: true,
            userId: true,
            message: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                steamId: true,
                discordUsername: true,
                profileName: true,
                deadlockRank: true,
                deadlockRankBadgeLevel: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        memberships: {
          include: {
            user: true,
          },
          orderBy: { joinedAt: "asc" },
        },
        requestedScrims: {
          include: {
            requesterTeam: true,
          },
          orderBy: { startsAt: "asc" },
          take: 6,
        },
        scheduleEvents: {
          include: {
            team: true,
          },
          orderBy: { startsAt: "asc" },
          where: { endsAt: { gte: new Date() } },
          take: 6,
        },
      },
    });

    if (!team) {
      return null;
    }

    const applications: TeamApplicationSummary[] = team.applications.map((application) => ({
      id: application.id,
      userId: application.userId,
      steamId: application.user.steamId,
      discordUsername: application.user.discordUsername,
      profileName: application.user.profileName,
      deadlockRank: application.user.deadlockRank,
      deadlockRankBadgeLevel: application.user.deadlockRankBadgeLevel,
      message: application.message,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
    }));

    return {
      userRole: selectedMembership.role,
      invite: {
        url:
          team.inviteToken && isActiveTeamInvite(team.inviteExpiresAt)
            ? getTeamInviteUrl(team.inviteToken)
            : null,
        expiresAt: team.inviteExpiresAt?.toISOString() ?? null,
      },
      team: {
        ...mapTeam(team, membershipData.user.id),
        members: team.memberships.map((membership) => ({
          id: membership.user.id,
          steamId: membership.user.steamId,
          discordUsername: membership.user.discordUsername,
          profileName: membership.user.profileName,
          role: membership.role,
          avatarUrl: membership.user.avatarUrl,
          deadlockRank: membership.user.deadlockRank,
          deadlockRankBadgeLevel: membership.user.deadlockRankBadgeLevel,
        })),
        upcomingSchedule: team.scheduleEvents.map(mapScheduleEvent),
      },
      applications,
      scrimRequests: team.requestedScrims.map(mapScrimRequest),
    };
  } catch {
    return null;
  }
}

export async function getTeamProfile(slug: string): Promise<TeamProfile | null> {
  noStore();

  return withFallback(
    async () => {
      const [user, includeDeclinedAt] = await Promise.all([
        getCurrentUser(),
        canStoreTeamApplicationDeclinedAt(),
      ]);
      const team = await prisma.team.findUnique({
        where: { slug },
        include: {
          applications: {
            where: {
              user: {
                steamId: user?.steamId ?? "__signed_out__",
              },
            },
            select: includeDeclinedAt
              ? { status: true, createdAt: true, declinedAt: true }
              : { status: true, createdAt: true },
            take: 1,
          },
          memberships: {
            include: {
              user: true,
            },
          },
          scheduleEvents: {
            include: {
              team: true,
            },
            orderBy: { startsAt: "asc" },
            where: { endsAt: { gte: new Date() } },
            take: 6,
          },
        },
      });

      if (!team) {
        return null;
      }

      return {
        ...mapTeam(team, user?.id),
        members: team.memberships.map((membership) => ({
          id: membership.user.id,
          steamId: membership.user.steamId,
          discordUsername: membership.user.discordUsername,
          profileName: membership.user.profileName,
          role: membership.role,
          avatarUrl: membership.user.avatarUrl,
          deadlockRank: membership.user.deadlockRank,
          deadlockRankBadgeLevel: membership.user.deadlockRankBadgeLevel,
        })),
        upcomingSchedule: team.scheduleEvents.map(mapScheduleEvent),
      };
    },
    demoTeamProfiles[slug] ?? null,
  );
}

export async function getOpenScrims(): Promise<OpenScrim[]> {
  noStore();

  return withFallback(
    async () => {
      const scrims = await prisma.scrimRequest.findMany({
        where: { status: "OPEN" },
        include: {
          requesterTeam: true,
        },
        orderBy: { startsAt: "asc" },
      });

      return scrims.map(mapScrimRequest);
    },
    demoScrims,
  );
}

export async function getScheduleFeed(): Promise<ScheduleFeedEvent[]> {
  noStore();

  return withFallback(
    async () => {
      const schedule = await prisma.scheduleEvent.findMany({
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        where: {
          endsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 12,
      });

      return schedule.map(mapScheduleEvent);
    },
    demoSchedule,
  );
}

export async function getTournamentCards(): Promise<TournamentCard[]> {
  noStore();

  return withFallback(
    async () => {
      const tournaments = await prisma.tournament.findMany({
        orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
      });

      return tournaments.map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        organizer: tournament.organizer,
        region: tournament.region,
        platform: tournament.platform,
        format: tournament.format,
        prizePool: tournament.prizePool,
        entryRequirements: tournament.entryRequirements,
        registrationUrl: tournament.registrationUrl,
        startsAt: tournament.startsAt.toISOString(),
        featured: tournament.featured,
      }));
    },
    demoTournaments,
  );
}

export async function getBroadcastCards(): Promise<BroadcastCard[]> {
  noStore();

  return withFallback(
    async () => {
      const broadcasts = await prisma.broadcast.findMany({
        include: {
          tournament: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { startsAt: "asc" }],
      });

      return broadcasts.map((broadcast) => ({
        id: broadcast.id,
        title: broadcast.title,
        channel: broadcast.channel,
        status: broadcast.status,
        startsAt: broadcast.startsAt.toISOString(),
        tournamentName: broadcast.tournament?.name ?? null,
      }));
    },
    demoBroadcasts,
  );
}
