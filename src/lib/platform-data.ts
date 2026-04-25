import { formatDistanceToNow } from "date-fns";
import { unstable_noStore as noStore } from "next/cache";
import { demoBroadcasts, demoDashboardData, demoSchedule, demoScrims, demoTeamProfiles, demoTeams, demoTournaments } from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { BroadcastCard, DashboardData, OpenScrim, ScheduleFeedEvent, TeamProfile, TeamSummary, TournamentCard } from "@/lib/types";

async function withFallback<T>(query: () => Promise<T>, fallback: T) {
  if (!hasDatabase()) {
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
  description: string;
  recruiting: boolean;
  openRoles: string[];
  memberships: Array<unknown>;
  scheduleEvents?: Array<{ startsAt: Date }>;
}): TeamSummary {
  return {
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
    memberCount: team.memberships.length,
    availability: team.scheduleEvents?.[0]
      ? `Next block ${formatDistanceToNow(team.scheduleEvents[0].startsAt, { addSuffix: true })}`
      : "Schedule open",
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
            where: { startsAt: { gte: new Date() } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

      return teams.map(mapTeam);
    },
    demoTeams,
  );
}

export async function getTeamsDirectory(): Promise<TeamSummary[]> {
  noStore();

  return withFallback(
    async () => {
      const teams = await prisma.team.findMany({
        include: {
          memberships: true,
          scheduleEvents: {
            orderBy: { startsAt: "asc" },
            take: 1,
            where: { startsAt: { gte: new Date() } },
          },
        },
        orderBy: [{ recruiting: "desc" }, { createdAt: "desc" }],
      });

      return teams.map(mapTeam);
    },
    demoTeams,
  );
}

export async function getTeamProfile(slug: string): Promise<TeamProfile | null> {
  noStore();

  return withFallback(
    async () => {
      const team = await prisma.team.findUnique({
        where: { slug },
        include: {
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
            where: { startsAt: { gte: new Date() } },
            take: 6,
          },
        },
      });

      if (!team) {
        return null;
      }

      return {
        ...mapTeam(team),
        members: team.memberships.map((membership) => ({
          id: membership.user.id,
          profileName: membership.user.profileName,
          role: membership.role,
          avatarUrl: membership.user.avatarUrl,
          deadlockRank: membership.user.deadlockRank,
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

      return scrims.map((scrim) => ({
        id: scrim.id,
        requesterTeamId: scrim.requesterTeamId,
        requesterTeamName: scrim.requesterTeam.name,
        requesterTag: scrim.requesterTeam.tag,
        region: scrim.region,
        format: scrim.format,
        wantedRank: scrim.wantedRank,
        notes: scrim.notes,
        startsAt: scrim.startsAt.toISOString(),
        status: scrim.status,
      }));
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
          startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
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
