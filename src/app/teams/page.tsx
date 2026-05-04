import { format } from "date-fns";
import Link from "next/link";
import {
  ClipboardList,
  Cog,
  PlusCircle,
  ShieldCheck,
  Swords,
  UserPlus,
  Users,
} from "lucide-react";
import { DiscordCopyButton } from "@/components/discord-copy-button";
import { SteamIcon } from "@/components/icons/steam-icon";
import { TeamDirectoryExplorer } from "@/components/team-directory-explorer";
import { TeamInviteLinkPanel } from "@/components/team-invite-link-panel";
import { TeamLeaveButton } from "@/components/team-leave-button";
import { TeamMemberKickButton } from "@/components/team-member-kick-button";
import { TeamApplicationActions } from "@/components/team-application-actions";
import { RankBadge } from "@/components/rank-badge";
import { SiteHeader } from "@/components/navigation/site-header";
import { ScheduleList } from "@/components/schedule-list";
import { StatlockerProfileLink } from "@/components/statlocker-profile-link";
import { getCurrentUser } from "@/lib/auth";
import {
  getCurrentUserTeamWorkspace,
  getTeamsDirectory,
} from "@/lib/platform-data";
import { getSteamProfileUrl } from "@/lib/steam-profile";
import type {
  OpenScrim,
  ScheduleFeedEvent,
  TeamApplicationSummary,
  TeamProfile,
  UserTeamWorkspace,
} from "@/lib/types";

type TeamsPageProps = {
  searchParams?: Promise<{
    team?: string | string[];
    setup?: string | string[];
    view?: string | string[];
  }>;
};

const APPLICATION_MANAGER_ROLES = new Set(["OWNER", "MANAGER"]);

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function canManageApplications(role: string | undefined) {
  return Boolean(role && APPLICATION_MANAGER_ROLES.has(role));
}

function roleLabel(role: string) {
  return role === "TRIAL" ? "Applicant" : role;
}

function DashboardHero({ workspace }: { workspace: UserTeamWorkspace }) {
  return (
    <section className="surface-strong rounded-lg p-8 md:p-10">
      <p className="eyebrow">Team Dashboard</p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
        Manage {workspace.team.name}.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
        Review player applications, roster status, scrim blocks, and recruiting posture from one
        team view.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
          {workspace.team.region}
        </span>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
          <RankBadge
            badgeLevel={workspace.team.primaryRankBadgeLevel}
            rank={workspace.team.primaryRank}
            size="sm"
          />
        </span>
        <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
          {workspace.userRole}
        </span>
      </div>
    </section>
  );
}

function TeamRoster({
  currentUserId,
  canKickMembers = false,
  showPlayerLeaveAction = false,
  team,
}: {
  currentUserId?: string | null;
  canKickMembers?: boolean;
  showPlayerLeaveAction?: boolean;
  team: TeamProfile;
}) {
  return (
    <section className="surface rounded-lg p-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Roster</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Players and roles</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {team.members.map((member) => (
          <div key={member.id} className="rounded-lg border border-line bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{member.profileName}</p>
                <p className="mt-1 text-sm text-muted">{roleLabel(member.role)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
                  <RankBadge
                    badgeLevel={member.deadlockRankBadgeLevel}
                    rank={member.deadlockRank}
                    size="sm"
                  />
                </span>
                <a
                  href={getSteamProfileUrl(member.steamId)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${member.profileName}'s Steam profile`}
                  title="Open Steam profile"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
                >
                  <SteamIcon className="h-4.5 w-4.5" />
                </a>
                <StatlockerProfileLink
                  steamId={member.steamId}
                  profileName={member.profileName}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
                  iconClassName="h-4.5 w-4.5"
                />
                {member.discordUsername ? (
                  <DiscordCopyButton
                    profileName={member.profileName}
                    username={member.discordUsername}
                  />
                ) : null}
                {canKickMembers && member.id !== currentUserId && member.role !== "OWNER" ? (
                  <TeamMemberKickButton
                    memberName={member.profileName}
                    slug={team.slug}
                    userId={member.id}
                  />
                ) : null}
                {showPlayerLeaveAction && member.id === currentUserId ? (
                  <TeamLeaveButton slug={team.slug} teamName={team.name} iconOnly />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OwnerInvites({
  applications,
  slug,
}: {
  applications: TeamApplicationSummary[];
  slug: string;
}) {
  return (
    <section className="surface rounded-lg p-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Applications</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Players to review</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {applications.length > 0 ? (
          applications.map((application) => (
            <div key={application.id} className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{application.profileName}</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={getSteamProfileUrl(application.steamId)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${application.profileName}'s Steam profile`}
                        title="Open Steam profile"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
                      >
                        <SteamIcon className="h-4 w-4" />
                      </a>
                      <StatlockerProfileLink
                        steamId={application.steamId}
                        profileName={application.profileName}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
                        iconClassName="h-4 w-4"
                      />
                      {application.discordUsername ? (
                        <DiscordCopyButton
                          profileName={application.profileName}
                          username={application.discordUsername}
                          size="sm"
                        />
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {format(new Date(application.createdAt), "MMM d, p")}
                  </p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-slate-100">
                  {application.status}
                </span>
              </div>
              {application.message ? (
                <p className="mt-3 text-sm leading-6 text-slate-300">{application.message}</p>
              ) : null}
              <TeamApplicationActions applicationId={application.id} slug={slug} />
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-line bg-white/5 p-4 text-sm text-muted">
            No pending applications yet. Keep role standards visible so qualified players know
            where to apply.
          </p>
        )}
      </div>
    </section>
  );
}

function OwnerScrimRequests({ scrims }: { scrims: OpenScrim[] }) {
  return (
    <section className="surface rounded-lg p-6">
      <div className="flex items-center gap-3">
        <Swords className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Scrim Requests</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Open match blocks</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {scrims.length > 0 ? (
          scrims.map((scrim) => (
            <div key={scrim.id} className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">
                  {scrim.format} · {scrim.region}
                </p>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs text-success">
                  {scrim.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {format(new Date(scrim.startsAt), "MMM d 'at' p")} · {scrim.wantedRank}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-line bg-white/5 p-4">
            <p className="text-sm text-muted">No open scrim requests yet.</p>
            <Link
              href="/scrims/calendar"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
            >
              <Swords className="h-4 w-4" />
              Open for scrims
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function OwnerSettings({
  currentUserId,
  invite,
  role,
  team,
}: {
  currentUserId: string | null;
  invite: UserTeamWorkspace["invite"];
  role: string;
  team: TeamProfile;
}) {
  return (
    <section className="surface rounded-lg p-6">
      <div className="flex items-center gap-3">
        <Cog className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Settings</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Recruiting posture</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-white/5 p-4">
          <p className="text-sm text-muted">Applications</p>
          <p className="mt-2 font-medium text-white">{team.recruiting ? "Open" : "Closed"}</p>
        </div>
        <div className="rounded-lg border border-line bg-white/5 p-4">
          <p className="text-sm text-muted">Open roles</p>
          <p className="mt-2 font-medium text-white">
            {team.openRoles.length > 0 ? team.openRoles.join(", ") : "None"}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={`/teams/${team.slug}?from=my-team`}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
        >
          View public team profile
          <ShieldCheck className="h-4 w-4" />
        </Link>
        <Link
          href={`/teams/recruiting?team=${team.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/6"
        >
          Change recruiting
          <UserPlus className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-6 border-t border-line pt-6">
        <p className="eyebrow">Team Invite</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">24-hour roster link</h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          Share this link with players you want to add directly to the roster.
        </p>
        <div className="mt-5">
          <TeamInviteLinkPanel
            initialExpiresAt={invite.expiresAt}
            initialUrl={invite.url}
            slug={team.slug}
          />
        </div>
      </div>
      <div className="mt-6 border-t border-line pt-6">
        <p className="eyebrow">Team Control</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">
          {role === "OWNER" ? "Leave or disband" : "Leave team"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          {role === "OWNER"
            ? "Transfer ownership before leaving, or permanently remove the team."
            : "Leaving removes your manager access and roster membership."}
        </p>
        <div className="mt-5">
          <TeamLeaveButton
            slug={team.slug}
            teamName={team.name}
            role={role}
            members={team.members}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </section>
  );
}

function OwnerDashboard({
  currentUserId,
  workspace,
}: {
  currentUserId: string | null;
  workspace: UserTeamWorkspace;
}) {
  return (
    <>
      <DashboardHero workspace={workspace} />
      <div className="grid gap-6 xl:grid-cols-2">
        <TeamRoster
          canKickMembers
          currentUserId={currentUserId}
          team={workspace.team}
        />
        <OwnerInvites applications={workspace.applications} slug={workspace.team.slug} />
        <OwnerScrimRequests scrims={workspace.scrimRequests} />
        <OwnerSettings
          currentUserId={currentUserId}
          invite={workspace.invite}
          role={workspace.userRole}
          team={workspace.team}
        />
      </div>
    </>
  );
}

function MemberDashboard({
  currentUserId,
  schedule,
  team,
  role,
}: {
  currentUserId: string | null;
  schedule: ScheduleFeedEvent[];
  team: TeamProfile;
  role: string;
}) {
  const upcomingScrims = schedule.filter((event) => event.type === "SCRIM");

  return (
    <>
      <section className="surface-strong rounded-lg p-8 md:p-10">
        <p className="eyebrow">Team Overview</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          You are rostered on {team.name}.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{team.description}</p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
            {roleLabel(role)}
          </span>
          <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
            {team.memberCount} members
          </span>
          <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
            <RankBadge
              badgeLevel={team.primaryRankBadgeLevel}
              rank={team.primaryRank}
              size="sm"
            />
          </span>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-6">
            <p className="eyebrow">Upcoming Scrims</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">Match blocks</h2>
          </div>
          {upcomingScrims.length > 0 ? (
            <ScheduleList events={upcomingScrims} />
          ) : (
            <div className="surface rounded-lg p-6 text-sm text-muted">
              No scrim blocks are scheduled yet.
            </div>
          )}
        </div>

        <div className="space-y-8">
          <TeamRoster
            currentUserId={currentUserId}
            showPlayerLeaveAction
            team={team}
          />
        </div>
      </section>
    </>
  );
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const teamSlug = asString(resolvedSearchParams.team) ?? asString(resolvedSearchParams.setup);
  const viewMode = asString(resolvedSearchParams.view);
  const [user, teams, workspace] = await Promise.all([
    getCurrentUser(),
    getTeamsDirectory(),
    getCurrentUserTeamWorkspace(teamSlug),
  ]);
  const canManageTeamApplications = canManageApplications(workspace?.userRole);
  const showWorkspace = Boolean(workspace && viewMode !== "browse");
  const ownTeamHref = workspace ? `/teams?team=${workspace.team.slug}` : "/teams";

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {showWorkspace && workspace ? (
          canManageTeamApplications ? (
            <OwnerDashboard currentUserId={user?.id ?? null} workspace={workspace} />
          ) : (
            <MemberDashboard
              currentUserId={user?.id ?? null}
              schedule={workspace.team.upcomingSchedule}
              team={workspace.team}
              role={workspace.userRole}
            />
          )
        ) : (
          <>
            <section className="border-b border-line/60 pb-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="eyebrow">Teams</p>
                  <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold tracking-tight text-white">
                    Find a team to join.
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                    Browse recruiting teams first, filter by role, and apply when a roster matches
                    your rank, region, and schedule.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="#browse-teams"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Browse teams
                  </Link>
                  <Link
                    href={workspace ? ownTeamHref : user ? "/teams/create" : "/sign-in"}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                  >
                    {workspace ? <Users className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {workspace ? "My team" : "Create team"}
                  </Link>
                </div>
              </div>
            </section>

            <TeamDirectoryExplorer
              teams={teams}
              canApply={!workspace}
              canViewProfiles={!workspace}
            />
          </>
        )}
      </main>
    </div>
  );
}
