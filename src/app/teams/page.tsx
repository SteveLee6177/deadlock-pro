import { format } from "date-fns";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Cog,
  ShieldCheck,
  Swords,
  UserPlus,
  Users,
} from "lucide-react";
import { CreateTeamForm } from "@/components/create-team-form";
import { TeamDirectoryExplorer } from "@/components/team-directory-explorer";
import { TeamLeaveButton } from "@/components/team-leave-button";
import { SiteHeader } from "@/components/navigation/site-header";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { ScheduleList } from "@/components/schedule-list";
import { getCurrentUser } from "@/lib/auth";
import {
  getCurrentUserTeamWorkspace,
  getTeamsDirectory,
} from "@/lib/platform-data";
import type {
  OpenScrim,
  ScheduleFeedEvent,
  TeamApplicationSummary,
  TeamProfile,
  UserTeamWorkspace,
} from "@/lib/types";

type TeamsPageProps = {
  searchParams?: Promise<{ setup?: string | string[] }>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function SetupChecklist({ workspace }: { workspace: UserTeamWorkspace }) {
  const items = [
    { label: "Team created", complete: true },
    { label: "Add team logo", complete: false },
    { label: "Invite players", complete: workspace.team.members.length > 1 },
    { label: "Set roles", complete: workspace.team.members.some((member) => member.role !== "OWNER") },
    { label: "Open for scrims", complete: workspace.scrimRequests.length > 0 },
  ];
  const completed = items.filter((item) => item.complete).length;

  return (
    <section className="surface-strong rounded-[36px] p-8 md:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Team Dashboard</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            {workspace.team.name} is live. Finish the setup flow.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Captains get the fastest path from empty roster hub to a scrim-ready team.
          </p>
        </div>
        <div className="surface rounded-[28px] p-6 lg:w-80">
          <p className="text-sm text-muted">Setup progress</p>
          <p className="mt-2 font-display text-4xl font-bold text-white">
            {completed}/{items.length}
          </p>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${(completed / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-5">
        {items.map((item) => {
          const Icon = item.complete ? CheckCircle2 : Circle;

          return (
            <div
              key={item.label}
              className="rounded-[22px] border border-line bg-white/5 p-4 text-sm text-slate-100"
            >
              <Icon
                className={`mb-3 h-5 w-5 ${item.complete ? "text-success" : "text-muted"}`}
              />
              {item.label}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DashboardHero({ workspace }: { workspace: UserTeamWorkspace }) {
  return (
    <section className="surface-strong rounded-[36px] p-8 md:p-10">
      <p className="eyebrow">Team Dashboard</p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
        Manage {workspace.team.name} without losing the thread.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
        Roster health, invites, scrim requests, and recruiting settings stay in one owner view.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
          {workspace.team.region}
        </span>
        <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
          {workspace.team.primaryRank}
        </span>
        <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
          {workspace.userRole}
        </span>
      </div>
    </section>
  );
}

function OwnerRoster({ team }: { team: TeamProfile }) {
  return (
    <section className="surface rounded-[28px] p-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Roster</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Players and roles</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {team.members.map((member) => (
          <div key={member.id} className="rounded-[22px] border border-line bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{member.profileName}</p>
                <p className="mt-1 text-sm text-muted">{member.role}</p>
              </div>
              {member.deadlockRank ? (
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs text-success">
                  {member.deadlockRank}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OwnerInvites({ applications }: { applications: TeamApplicationSummary[] }) {
  return (
    <section className="surface rounded-[28px] p-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Invites</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Applicants to review</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {applications.length > 0 ? (
          applications.map((application) => (
            <div key={application.id} className="rounded-[22px] border border-line bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{application.profileName}</p>
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
            </div>
          ))
        ) : (
          <p className="rounded-[22px] border border-line bg-white/5 p-4 text-sm text-muted">
            No pending applications yet. Keep open roles visible so players know where to apply.
          </p>
        )}
      </div>
    </section>
  );
}

function OwnerScrimRequests({ scrims }: { scrims: OpenScrim[] }) {
  return (
    <section className="surface rounded-[28px] p-6">
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
            <div key={scrim.id} className="rounded-[22px] border border-line bg-white/5 p-4">
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
          <div className="rounded-[22px] border border-line bg-white/5 p-4">
            <p className="text-sm text-muted">No open scrim requests yet.</p>
            <Link
              href="/scrims"
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

function OwnerSettings({ team }: { team: TeamProfile }) {
  return (
    <section className="surface rounded-[28px] p-6">
      <div className="flex items-center gap-3">
        <Cog className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Settings</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Recruiting posture</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-line bg-white/5 p-4">
          <p className="text-sm text-muted">Recruiting</p>
          <p className="mt-2 font-medium text-white">{team.recruiting ? "Open" : "Closed"}</p>
        </div>
        <div className="rounded-[22px] border border-line bg-white/5 p-4">
          <p className="text-sm text-muted">Open roles</p>
          <p className="mt-2 font-medium text-white">
            {team.openRoles.length > 0 ? team.openRoles.join(", ") : "None"}
          </p>
        </div>
      </div>
      <Link
        href={`/teams/${team.slug}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
      >
        View public team profile
        <ShieldCheck className="h-4 w-4" />
      </Link>
    </section>
  );
}

function OwnerDashboard({
  setupMode,
  workspace,
}: {
  setupMode: boolean;
  workspace: UserTeamWorkspace;
}) {
  return (
    <>
      {setupMode ? <SetupChecklist workspace={workspace} /> : <DashboardHero workspace={workspace} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerRoster team={workspace.team} />
        <OwnerInvites applications={workspace.applications} />
        <OwnerScrimRequests scrims={workspace.scrimRequests} />
        <OwnerSettings team={workspace.team} />
      </div>
    </>
  );
}

function MemberDashboard({
  schedule,
  team,
  role,
}: {
  schedule: ScheduleFeedEvent[];
  team: TeamProfile;
  role: string;
}) {
  const upcomingScrims = schedule.filter((event) => event.type === "SCRIM");

  return (
    <>
      <section className="surface-strong rounded-[36px] p-8 md:p-10">
        <p className="eyebrow">Team Overview</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          You are on {team.name}.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{team.description}</p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
            {role}
          </span>
          <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
            {team.memberCount} members
          </span>
          <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
            {team.primaryRank}
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
            <div className="surface rounded-[28px] p-6 text-sm text-muted">
              No scrims are scheduled yet.
            </div>
          )}
        </div>

        <div className="surface rounded-[28px] p-6">
          <p className="eyebrow">Membership</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white">Team status</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Leaving removes you from the roster and returns the Teams tab to discovery mode.
          </p>
          <div className="mt-6">
            <TeamLeaveButton slug={team.slug} />
          </div>
        </div>
      </section>
    </>
  );
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const setupSlug = asString(resolvedSearchParams.setup);
  const [user, teams, workspace] = await Promise.all([
    getCurrentUser(),
    getTeamsDirectory(),
    getCurrentUserTeamWorkspace(setupSlug),
  ]);
  const setupMode = Boolean(setupSlug && workspace?.team.slug === setupSlug);
  const isOwner = workspace?.userRole === "OWNER";

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {workspace ? (
          isOwner ? (
            <OwnerDashboard setupMode={setupMode} workspace={workspace} />
          ) : (
            <MemberDashboard
              schedule={workspace.team.upcomingSchedule}
              team={workspace.team}
              role={workspace.userRole}
            />
          )
        ) : (
          <>
            <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="surface-strong rounded-[36px] p-8 md:p-10">
                <p className="eyebrow">Teams</p>
                <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
                  Find a roster or start one with a clear next step.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                  Players can filter for teams with open roles. Captains can create a team and
                  move straight into setup instead of landing back in the directory.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {user ? (
                    <Link
                      href="#create-team"
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                    >
                      <Users className="h-4 w-4" />
                      Create a team
                    </Link>
                  ) : (
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                    >
                      <Users className="h-4 w-4" />
                      Sign in to create
                    </Link>
                  )}
                  <Link
                    href="#browse-teams"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Browse teams
                  </Link>
                </div>
              </div>

              {user ? (
                <div id="create-team">
                  <CreateTeamForm disabled={false} />
                </div>
              ) : (
                <GuestAccessCard
                  eyebrow="View Only"
                  title="Scout teams before you commit"
                  description="Guests can browse rosters, roles, and schedules. Sign in with Steam to create a team or introduce yourself to captains."
                />
              )}
            </section>

            <TeamDirectoryExplorer teams={teams} />
          </>
        )}
      </main>
    </div>
  );
}
