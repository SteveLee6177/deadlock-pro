import type {
  BroadcastCard,
  DashboardData,
  OpenScrim,
  ScheduleFeedEvent,
  TeamProfile,
  TeamSummary,
  TournamentCard,
} from "@/lib/types";

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const demoTeams: TeamSummary[] = [
  {
    id: "team-chronoshift",
    slug: "chronoshift",
    name: "Chronoshift",
    tag: "CSH",
    region: "NA East",
    focus: "Structured scrim blocks and nightly review sessions.",
    primaryRank: "Phantom",
    description:
      "Growth-focused roster for players who want consistent practice, clear structure, and a direct path into tournaments.",
    recruiting: true,
    openRoles: ["Flex", "Coach"],
    memberCount: 5,
    availability: "Open for weeknight scrims",
  },
  {
    id: "team-harbor-nine",
    slug: "harbor-nine",
    name: "Harbor Nine",
    tag: "HB9",
    region: "NA Central",
    focus: "Tempo comps, pressure-heavy macro, and fast scheduling.",
    primaryRank: "Oracle",
    description:
      "Midwest roster building a strong weekly tournament routine through Faceit cups and community events.",
    recruiting: true,
    openRoles: ["Anchor", "Analyst"],
    memberCount: 4,
    availability: "Prefers weekend match blocks",
  },
  {
    id: "team-glasshouse",
    slug: "glasshouse",
    name: "Glasshouse",
    tag: "GLS",
    region: "EU West",
    focus: "Execution-heavy playbooks and disciplined comms.",
    primaryRank: "Archon",
    description:
      "Tournament-minded roster tuned for qualifiers, scrim accountability, and polished map prep.",
    recruiting: false,
    openRoles: [],
    memberCount: 6,
    availability: "Closed roster, available for EU scrims",
  },
];

export const demoTeamProfiles: Record<string, TeamProfile> = {
  chronoshift: {
    ...demoTeams[0],
    members: [
      {
        id: "maya",
        profileName: "Maya Voltage",
        role: "Owner / IGL",
        avatarUrl: null,
        deadlockRank: "Phantom",
      },
      {
        id: "jordan",
        profileName: "Jordan Harbor",
        role: "Player",
        avatarUrl: null,
        deadlockRank: "Oracle",
      },
    ],
    upcomingSchedule: [
      {
        id: "sched-1",
        teamId: "team-chronoshift",
        teamName: "Chronoshift",
        title: "Scrim vs Harbor Nine",
        type: "SCRIM",
        startsAt: hoursFromNow(8),
        endsAt: hoursFromNow(11),
        location: "Discord / NA East",
        notes: "Three-map set with review between maps.",
      },
      {
        id: "sched-2",
        teamId: "team-chronoshift",
        teamName: "Chronoshift",
        title: "VOD Review Block",
        type: "REVIEW",
        startsAt: hoursFromNow(30),
        endsAt: hoursFromNow(32),
        location: "Notion + Discord",
        notes: "Focus on midgame rotations.",
      },
    ],
  },
  "harbor-nine": {
    ...demoTeams[1],
    members: [
      {
        id: "jordan",
        profileName: "Jordan Harbor",
        role: "Owner",
        avatarUrl: null,
        deadlockRank: "Oracle",
      },
      {
        id: "neo",
        profileName: "Neo Drift",
        role: "Captain",
        avatarUrl: null,
        deadlockRank: "Phantom",
      },
    ],
    upcomingSchedule: [
      {
        id: "sched-3",
        teamId: "team-harbor-nine",
        teamName: "Harbor Nine",
        title: "Aim & Micro Lab",
        type: "PRACTICE",
        startsAt: hoursFromNow(4),
        endsAt: hoursFromNow(6),
        location: "Private Lobby",
        notes: "Duel reps and movement work.",
      },
    ],
  },
  glasshouse: {
    ...demoTeams[2],
    members: [
      {
        id: "casey",
        profileName: "Casey Reverb",
        role: "Owner",
        avatarUrl: null,
        deadlockRank: "Archon",
      },
    ],
    upcomingSchedule: [
      {
        id: "sched-4",
        teamId: "team-glasshouse",
        teamName: "Glasshouse",
        title: "Qualifier Prep",
        type: "TOURNAMENT",
        startsAt: hoursFromNow(50),
        endsAt: hoursFromNow(54),
        location: "Faceit Check-In",
        notes: "Standby player on call.",
      },
    ],
  },
};

export const demoScrims: OpenScrim[] = [
  {
    id: "scrim-1",
    requesterTeamId: "team-chronoshift",
    requesterTeamName: "Chronoshift",
    requesterTag: "CSH",
    region: "NA East",
    format: "Bo3",
    wantedRank: "Oracle+",
    notes: "Need a 9 PM ET block with 10 minute feedback after each map.",
    startsAt: hoursFromNow(8),
    status: "OPEN",
  },
  {
    id: "scrim-2",
    requesterTeamId: "team-glasshouse",
    requesterTeamName: "Glasshouse",
    requesterTag: "GLS",
    region: "EU West",
    format: "Bo5",
    wantedRank: "Archon+",
    notes: "Testing an updated comp package before weekend quals.",
    startsAt: hoursFromNow(28),
    status: "OPEN",
  },
];

export const demoSchedule: ScheduleFeedEvent[] = [
  demoTeamProfiles.chronoshift.upcomingSchedule[0],
  demoTeamProfiles["harbor-nine"].upcomingSchedule[0],
  demoTeamProfiles.glasshouse.upcomingSchedule[0],
];

export const demoTournaments: TournamentCard[] = [
  {
    id: "t-1",
    name: "Faceit Deadlock Weekly",
    organizer: "FACEIT",
    region: "North America",
    platform: "FACEIT",
    format: "Single Elimination Bo3",
    prizePool: "$750",
    entryRequirements: "Captain must verify roster on FACEIT.",
    registrationUrl: "https://www.faceit.com/",
    startsAt: hoursFromNow(72),
    featured: true,
  },
  {
    id: "t-2",
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
];

export const demoBroadcasts: BroadcastCard[] = [
  {
    id: "b-1",
    title: "Weekly Showcase Stream",
    channel: "twitchrivals",
    status: "LIVE",
    startsAt: hoursFromNow(-1),
    tournamentName: "Faceit Deadlock Weekly",
  },
  {
    id: "b-2",
    title: "Death Slam Main Broadcast",
    channel: "beyondthesummit",
    status: "UPCOMING",
    startsAt: hoursFromNow(48),
    tournamentName: "Death Slam Open",
  },
];

export const demoDashboardData: DashboardData = {
  user: {
    id: "demo-user",
    steamId: "76561198000000001",
    profileName: "Maya Voltage",
    avatarUrl: null,
    deadlockRank: "Phantom",
  },
  featuredTeams: demoTeams,
  openScrims: demoScrims,
  schedule: demoSchedule,
  tournaments: demoTournaments,
  broadcasts: demoBroadcasts,
  stats: [
    {
      label: "Active teams",
      value: "24",
      detail: "Mix of recruiting rosters and established stacks.",
    },
    {
      label: "Open scrims",
      value: "11",
      detail: "Live board refreshes as new requests land.",
    },
    {
      label: "Tournament links",
      value: "8",
      detail: "FACEIT, Battlefy, and community-run bracket hubs.",
    },
  ],
};
