import Link from "next/link";
import { ArrowRight, CalendarClock, ShieldCheck, Swords, Trophy, Tv, Users } from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";
import { ScrimCard } from "@/components/scrim-card";
import { StatCard } from "@/components/stat-card";
import { TeamCard } from "@/components/team-card";
import { TournamentCard } from "@/components/tournament-card";
import { getDashboardData } from "@/lib/platform-data";

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <div className="min-h-screen">
      <SiteHeader user={data.user} />

      <main>
        <section className="hero-grid relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
            <div>
              <p className="eyebrow">Deadlock Esports Operations</p>
              <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                The team hub for players trying to break into competitive Deadlock.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Deadlock Pro gives the community a dedicated place to recruit, post scrims,
                keep team calendars current, watch live broadcasts, and jump straight into
                tournaments from one clean workflow.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                >
                  Sign in with Steam
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={data.user ? "/dashboard" : "/tournaments"}
                  className="rounded-full border border-line px-6 py-3 text-sm font-medium text-white transition hover:bg-white/6"
                >
                  {data.user ? "Explore the dashboard" : "Browse tournaments"}
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {data.stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
            </div>

            <div className="surface-strong rounded-[36px] p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Platform Snapshot</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-white">
                    What players actually need
                  </h2>
                </div>
                {data.user?.deadlockRank ? (
                  <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm font-medium text-success">
                    {data.user.deadlockRank}
                  </span>
                ) : null}
              </div>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: Users,
                    title: "Find or launch a team",
                    detail: "Recruit around actual rank, region, role needs, and practice expectations.",
                  },
                  {
                    icon: Swords,
                    title: "Scrims with live schedule updates",
                    detail: "Post requests and push changes to every subscribed roster without refreshing.",
                  },
                  {
                    icon: Trophy,
                    title: "Tournament pipeline",
                    detail: "Track registration links across FACEIT and community organizers in one place.",
                  },
                  {
                    icon: Tv,
                    title: "Broadcast visibility",
                    detail: "Embed Twitch streams so players can follow the scene while managing their own team.",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="rounded-[24px] border border-line bg-white/5 p-5">
                    <feature.icon className="h-5 w-5 text-accent-strong" />
                    <h3 className="mt-4 font-display text-xl font-bold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{feature.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Recruiting Teams</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white">
                Roster discovery built for serious players
              </h2>
            </div>
            <Link href="/teams" className="text-sm font-medium text-accent-strong">
              View all teams
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {data.featuredTeams.slice(0, 3).map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-6">
              <p className="eyebrow">Open Scrims</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white">
                Find the next set fast
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
              <p className="eyebrow">Tournament Feed</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white">
                Jump from scouting to registration
              </h2>
            </div>
            <div className="space-y-6">
              {data.tournaments.slice(0, 2).map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: ShieldCheck,
              title: "Steam sign-in and Deadlock rank sync",
              detail:
                "Use Steam OpenID to authenticate, then enrich the user profile with Deadlock rank data tied to the Steam ID.",
            },
            {
              icon: CalendarClock,
              title: "Shared team calendar",
              detail:
                "Practice, scrims, reviews, and tournaments stay visible to the whole roster with Redis-backed live updates.",
            },
            {
              icon: Tv,
              title: "Scene visibility on one homepage",
              detail:
                "Current tournaments and Twitch broadcasts stay surfaced so teams never lose track of what is happening in the community.",
            },
          ].map((item) => (
            <div key={item.title} className="surface rounded-[28px] p-6">
              <item.icon className="h-6 w-6 text-accent-strong" />
              <h3 className="mt-5 font-display text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
