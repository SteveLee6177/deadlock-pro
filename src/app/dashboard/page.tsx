import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, Flame, Radar, ShieldCheck } from "lucide-react";
import { LiveScheduleBoard } from "@/components/live/live-schedule-board";
import { SiteHeader } from "@/components/navigation/site-header";
import { PlayerApplicationActions } from "@/components/player-application-actions";
import { ScrimCard } from "@/components/scrim-card";
import { TeamCard } from "@/components/team-card";
import { TournamentCard } from "@/components/tournament-card";
import { hasRedis } from "@/lib/env";
import { getCurrentUserApplications, getCurrentUserTeams, getDashboardData } from "@/lib/platform-data";

export default async function DashboardPage() {
  const [data, teams, applications] = await Promise.all([
    getDashboardData(),
    getCurrentUserTeams(),
    getCurrentUserApplications(),
  ]);

  if (!data.user) {
    redirect("/sign-in");
  }

  const currentTeamIds = new Set(teams.map((team) => team.id));
  const activeInvites = applications.filter(
    (application) =>
      application.status === "APPROVED" && !currentTeamIds.has(application.team.id),
  );
  const hasTeam = teams.length > 0;

  return (
    <div className="min-h-screen">
      <SiteHeader user={data.user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {activeInvites.length > 0 ? (
          <section className="rounded-lg border border-success/30 bg-success/10 p-5 shadow-lg shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-success">Team invite waiting</p>
                  <h2 className="mt-1 font-display text-3xl font-bold text-white">
                    {activeInvites[0].team.name} wants you on the roster.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Review the team before you accept. Declining clears the invite from your profile and bell.
                  </p>
                </div>
              </div>
              <Link
                href={`/teams/${activeInvites[0].team.slug}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-white transition hover:bg-white/6"
              >
                View team
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {hasTeam ? (
              <p className="mt-4 text-sm text-muted">
                Leave your current team before accepting another invite.
              </p>
            ) : null}
            <PlayerApplicationActions applicationId={activeInvites[0].id} disabled={hasTeam} />
          </section>
        ) : null}

        <section className="surface-strong rounded-lg p-8 md:p-10">
          <p className="eyebrow">Command Center</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h1 className="font-display text-5xl font-bold tracking-tight text-white">
                {data.user
                  ? `${data.user.profileName}, your performance desk is live.`
                  : "A Deadlock hub that still works before the backend is wired."}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                This dashboard is the daily operating layer for team applications, open scrims,
                tournament entry links, and a live-updating team schedule stream powered by Redis.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/scrims/calendar"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                >
                  Post a scrim
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/teams"
                  className="rounded-full border border-line px-6 py-3 text-sm font-medium text-white transition hover:bg-white/6"
                >
                  Browse teams
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Steam-authenticated identities",
                  detail: "Keep sign-in tied to Steam IDs and sync Deadlock rank after login.",
                },
                {
                  icon: Flame,
                  title: "Scene awareness",
                  detail: `${data.broadcasts.length} featured broadcasts and ${data.tournaments.length} tournaments ready to track.`,
                },
                {
                  icon: Radar,
                  title: "Scrim velocity",
                  detail: `${data.openScrims.length} open scrims surfaced with team names, rank targets, and timing.`,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-line bg-white/5 p-5">
                  <item.icon className="h-5 w-5 text-accent-strong" />
                  <h2 className="mt-4 font-display text-xl font-bold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Featured Teams</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Recruiting and scrim active
                </h2>
              </div>
              <Link href="/teams" className="text-sm font-medium text-accent-strong">
                All teams
              </Link>
            </div>
            <div className="space-y-6">
              {data.featuredTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <div className="mb-6">
                <p className="eyebrow">Open Scrims</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Current requests
                </h2>
              </div>
              <div className="space-y-6">
                {data.openScrims.map((scrim) => (
                  <ScrimCard key={scrim.id} scrim={scrim} />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-6">
                <p className="eyebrow">Featured Tournaments</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Quick entry links
                </h2>
              </div>
              <div className="space-y-6">
                {data.tournaments.slice(0, 2).map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          </section>
        </div>

        <LiveScheduleBoard initialEvents={data.schedule} liveEnabled={hasRedis()} />
      </main>
    </div>
  );
}
