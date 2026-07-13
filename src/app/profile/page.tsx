import Link from "next/link";
import { ClipboardList, ShieldCheck, Users } from "lucide-react";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { SiteHeader } from "@/components/navigation/site-header";
import { PlayerApplicationActions } from "@/components/player-application-actions";
import { ProfileIdentityPanel } from "@/components/profile-identity-panel";
import { RankBadge } from "@/components/rank-badge";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserApplications, getCurrentUserTeams } from "@/lib/platform-data";
import { formatTeamRole } from "@/lib/team-roles";

function applicationStatusLabel(status: string) {
  if (status === "APPROVED") {
    return "Invited";
  }

  if (status === "DECLINED") {
    return "Declined";
  }

  return "Pending review";
}

function applicationStatusClassName(status: string) {
  if (status === "APPROVED") {
    return "border-success/30 bg-success/10 text-success";
  }

  if (status === "DECLINED") {
    return "border-rose-300/40 bg-rose-300/12 text-rose-200";
  }

  return "border-accent-strong/30 bg-accent-strong/10 text-accent-strong";
}

export default async function ProfilePage() {
  const [user, teams, applications] = await Promise.all([
    getCurrentUser(),
    getCurrentUserTeams(),
    getCurrentUserApplications(),
  ]);
  const hasTeam = teams.length > 0;
  const currentTeamIds = new Set(teams.map((team) => team.id));

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {user ? (
          <>
            <ProfileIdentityPanel
              deadlockRank={user.deadlockRank}
              deadlockRankBadgeLevel={user.deadlockRankBadgeLevel}
              discordUsername={user.discordUsername}
              profileName={user.profileName}
              steamId={user.steamId}
            />

            <section className="surface rounded-lg p-6">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-accent-strong" />
                <div>
                  <p className="eyebrow">Applications</p>
                  <h2 className="mt-1 font-display text-3xl font-bold text-white">
                    Your team options
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {applications.length > 0 ? (
                  applications.map((application) => {
                    const isTeamMember = currentTeamIds.has(application.team.id);

                    return (
                      <div
                        key={application.id}
                        className="rounded-lg border border-line bg-white/5 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{application.team.name}</p>
                              <RankBadge
                                badgeLevel={application.team.primaryRankBadgeLevel}
                                rank={application.team.primaryRank}
                                size="sm"
                              />
                            </div>
                            <p className="mt-1 text-sm text-muted">Region {application.team.region}</p>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${applicationStatusClassName(application.status)}`}
                          >
                            {applicationStatusLabel(application.status)}
                          </span>
                        </div>
                        {application.message ? (
                          <p className="mt-3 text-sm leading-6 text-slate-300">
                            {application.message}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <Link
                            href={`/teams/${application.team.slug}`}
                            className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/6"
                          >
                            View Roster
                          </Link>
                          {application.status === "APPROVED" ? (
                            isTeamMember ? (
                              <p className="text-sm text-muted">You are on this roster.</p>
                            ) : hasTeam ? (
                              <p className="text-sm text-muted">
                                Leave your current team before accepting another invite.
                              </p>
                            ) : (
                              <PlayerApplicationActions applicationId={application.id} />
                            )
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-line bg-white/5 p-4">
                    <p className="text-sm text-muted">
                      You have not applied to any teams yet.
                    </p>
                    <Link
                      href="/teams"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                    >
                      Browse teams
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <section className="surface rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent-strong" />
                <div>
                  <p className="eyebrow">Teams</p>
                  <h2 className="mt-1 font-display text-3xl font-bold text-white">
                    Your roster status
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams?team=${team.slug}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white/5 p-4 transition hover:border-accent/40"
                    >
                      <div>
                        <p className="font-medium text-white">{team.name}</p>
                        <p className="mt-1 text-sm text-muted">{formatTeamRole(team.role)}</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-accent-strong" />
                    </Link>
                  ))
                ) : (
                  <div className="rounded-lg border border-line bg-white/5 p-4">
                    <p className="text-sm text-muted">You are not on a team yet.</p>
                    <Link
                      href="/teams"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                    >
                      Browse teams
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <GuestAccessCard
            eyebrow="Sign In Required"
            title="Connect Steam to see your profile"
            description="Your profile shows roster status, rank, and team shortcuts once you sign in."
          />
        )}
      </main>
    </div>
  );
}
