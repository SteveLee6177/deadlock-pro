export type SessionUser = {
  id: string;
  steamId: string;
  profileName: string;
  avatarUrl: string | null;
  deadlockRank: string | null;
};

export type TeamSummary = {
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
  memberCount: number;
  availability: string;
};

export type TeamProfile = TeamSummary & {
  members: Array<{
    id: string;
    profileName: string;
    role: string;
    avatarUrl: string | null;
    deadlockRank: string | null;
  }>;
  upcomingSchedule: ScheduleFeedEvent[];
};

export type OpenScrim = {
  id: string;
  requesterTeamId: string;
  requesterTeamName: string;
  requesterTag: string;
  region: string;
  format: string;
  wantedRank: string;
  notes: string | null;
  startsAt: string;
  status: string;
};

export type ScheduleFeedEvent = {
  id: string;
  teamId: string;
  teamName: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
};

export type TournamentCard = {
  id: string;
  name: string;
  organizer: string;
  region: string;
  platform: string;
  format: string;
  prizePool: string | null;
  entryRequirements: string | null;
  registrationUrl: string;
  startsAt: string;
  featured: boolean;
};

export type BroadcastCard = {
  id: string;
  title: string;
  channel: string;
  status: string;
  startsAt: string;
  tournamentName: string | null;
};

export type DashboardData = {
  user: SessionUser | null;
  featuredTeams: TeamSummary[];
  openScrims: OpenScrim[];
  schedule: ScheduleFeedEvent[];
  tournaments: TournamentCard[];
  broadcasts: BroadcastCard[];
  stats: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
};
