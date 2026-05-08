import type {
  BroadcastCard,
  DashboardData,
  OpenScrim,
  ScheduleFeedEvent,
  TeamProfile,
  TeamSummary,
  TournamentCard,
} from "@/lib/types";

export const demoTeams: TeamSummary[] = [];

export const demoTeamProfiles: Record<string, TeamProfile> = {};

export const demoScrims: OpenScrim[] = [];

export const demoSchedule: ScheduleFeedEvent[] = [];

export const demoTournaments: TournamentCard[] = [];

export const demoBroadcasts: BroadcastCard[] = [];

export const demoDashboardData: DashboardData = {
  user: null,
  featuredTeams: demoTeams,
  openScrims: demoScrims,
  schedule: demoSchedule,
  tournaments: demoTournaments,
  broadcasts: demoBroadcasts,
  stats: [],
};
