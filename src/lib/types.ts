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
  currentUserApplicationStatus?: string | null;
  currentUserCanApply?: boolean;
};

export type UserTeamOption = {
  id: string;
  slug: string;
  name: string;
  tag: string;
  role: string;
};

export type ScrimTeamOption = UserTeamOption & {
  canManageScrims: boolean;
  region: string;
  primaryRank: string;
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

export type TeamApplicationSummary = {
  id: string;
  userId: string;
  profileName: string;
  deadlockRank: string | null;
  message: string | null;
  status: string;
  createdAt: string;
};

export type PlayerApplicationSummary = {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  team: {
    id: string;
    slug: string;
    name: string;
    region: string;
    primaryRank: string;
    recruiting: boolean;
  };
};

export type UserTeamWorkspace = {
  userRole: string;
  team: TeamProfile;
  applications: TeamApplicationSummary[];
  scrimRequests: OpenScrim[];
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

export type ScrimAvailabilitySummary = {
  id: string;
  teamId: string;
  teamSlug: string;
  teamName: string;
  teamTag: string;
  region: string;
  rank: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: string;
};

export type ScrimRequestSummary = {
  id: string;
  availabilityBlockId: string;
  requestingTeamId: string;
  requestingTeamName: string;
  requestingTeamSlug: string;
  requestingTeamRegion: string;
  requestingTeamRank: string;
  receivingTeamId: string;
  receivingTeamName: string;
  receivingTeamSlug: string;
  receivingTeamRegion: string;
  receivingTeamRank: string;
  startTime: string;
  endTime: string;
  message: string | null;
  status: string;
  createdAt: string;
};

export type ScrimMatchSummary = {
  id: string;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
};

export type ScrimChatEntity =
  | {
      kind: "request";
      id: string;
    }
  | {
      kind: "scrim";
      id: string;
    };

export type ScrimChatMessage = {
  id: string;
  senderUserId: string;
  senderName: string;
  senderTeamId: string;
  senderTeamName: string;
  body: string;
  createdAt: string;
};

export type ScrimConversationSummary = {
  id: string;
  title: string;
  subtitle: string;
  teams: Array<{
    id: string;
    name: string;
    tag: string;
  }>;
  manageableTeamIds: string[];
  messages: ScrimChatMessage[];
};

export type ScrimCalendarEvent = {
  id: string;
  kind: "availability" | "request" | "scrim";
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  opponentName: string | null;
};

export type ScrimWorkspace = {
  team: ScrimTeamOption | null;
  teams: ScrimTeamOption[];
  upcomingScrims: ScrimMatchSummary[];
  availabilityBlocks: ScrimAvailabilitySummary[];
  openBlocks: ScrimAvailabilitySummary[];
  incomingRequests: ScrimRequestSummary[];
  outgoingRequests: ScrimRequestSummary[];
  calendarEvents: ScrimCalendarEvent[];
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
