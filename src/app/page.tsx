import Link from "next/link";
import { addDays, startOfDay } from "date-fns";
import { ArrowRight, CalendarClock, Search, ShieldCheck, Swords, Users } from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";
import { HourlyScrimCalendar } from "@/components/scrims/hourly-scrim-calendar";
import { TeamCard } from "@/components/team-card";
import { getDashboardData } from "@/lib/platform-data";
import type { ScrimCalendarEvent, ScrimTeamOption } from "@/lib/types";

const previewTeam: ScrimTeamOption = {
  id: "preview-team-sanguine",
  slug: "sanguine",
  name: "Sanguine",
  tag: "SGN",
  role: "OWNER",
  canManageScrims: false,
  region: "NA",
  primaryRank: "Eternus 6",
};

function makePreviewEvent(
  weekStart: Date,
  dayOffset: number,
  hour: number,
  durationHours: number,
  event: Omit<ScrimCalendarEvent, "endTime" | "startTime">,
): ScrimCalendarEvent {
  const startTime = new Date(
    addDays(weekStart, dayOffset).getFullYear(),
    addDays(weekStart, dayOffset).getMonth(),
    addDays(weekStart, dayOffset).getDate(),
    hour,
  );
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  return {
    ...event,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  };
}

function getPreviewCalendarEvents(): ScrimCalendarEvent[] {
  const weekStart = startOfDay(new Date());

  return [
    makePreviewEvent(weekStart, 1, 19, 1, {
      id: "preview-lfs-monday",
      kind: "availability",
      title: "Open availability",
      status: "OPEN",
      notes: "Looking for Eternus 5+ Bo3.",
      opponentName: null,
    }),
    makePreviewEvent(weekStart, 2, 20, 2, {
      id: "preview-scrim-harbor",
      kind: "scrim",
      title: "Scrim vs Harbor Nine",
      status: "CONFIRMED",
      notes: "Two-map set with VOD review after.",
      opponentName: "Harbor Nine",
    }),
    makePreviewEvent(weekStart, 3, 21, 1, {
      id: "preview-request-glasshouse",
      kind: "request",
      title: "Pending vs Glasshouse",
      status: "PENDING",
      notes: "EU team asking for a late block.",
      opponentName: "Glasshouse",
    }),
    makePreviewEvent(weekStart, 4, 19, 1, {
      id: "preview-lfs-thursday",
      kind: "availability",
      title: "Open availability",
      status: "OPEN",
      notes: "Testing tournament comp.",
      opponentName: null,
    }),
    makePreviewEvent(weekStart, 5, 22, 2, {
      id: "preview-scrim-chronoshift",
      kind: "scrim",
      title: "Scrim vs Chronoshift",
      status: "CONFIRMED",
      notes: "Qualifier prep block.",
      opponentName: "Chronoshift",
    }),
  ];
}

export default async function HomePage() {
  const data = await getDashboardData();
  const previewEvents = getPreviewCalendarEvents();

  return (
    <div className="min-h-screen">
      <SiteHeader user={data.user} />

      <main>
        <section className="hero-grid border-b border-line/60">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="eyebrow">Scrimlock</p>
                <h1 className="mt-5 max-w-4xl font-display text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl">
                  Scrims, rosters, and practice blocks without the noise.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                  Scrimlock is built around one job: helping serious Deadlock teams schedule
                  practice fast. Eternus-level captains can post LFS blocks, track confirmed
                  scrims, and keep the week readable. Players at any rank can find teams, improve,
                  and work toward cleaner practice.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/scrims/calendar"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                  >
                    Open scrim calendar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/teams"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-white transition hover:bg-white/6"
                  >
                    <Search className="h-4 w-4" />
                    Browse teams
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Weekly calendar", value: "LFS + scrims", icon: CalendarClock },
                  { label: "Roster intent", value: "Roles open", icon: Users },
                  { label: "Practice quality", value: "Eternus focus", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.label} className="surface rounded-lg p-5">
                    <item.icon className="h-5 w-5 text-accent-strong" />
                    <p className="mt-4 text-sm text-muted">{item.label}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Calendar Preview</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-white">
                    See the week before Discord buries it.
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-muted">
                  Example data only: a team owner can post LFS blocks, review pending requests,
                  and see confirmed scrims in one weekly view.
                </p>
              </div>
              <HourlyScrimCalendar
                events={previewEvents}
                requests={[]}
                teams={[previewTeam]}
                selectedTeam={previewTeam}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: Swords,
              title: "Post Looking For Scrim blocks",
              detail:
                "Owners and managers mark the exact hours they want practice. Other teams request the block without chasing DMs.",
            },
            {
              icon: CalendarClock,
              title: "Track confirmed sets",
              detail:
                "Confirmed scrims land on the team calendar so players know when to be ready and what the week looks like.",
            },
            {
              icon: Users,
              title: "Find teams with intent",
              detail:
                "Recruiting teams list roles, rank expectations, and roster needs so players can apply where they actually fit.",
            },
          ].map((item) => (
            <div key={item.title} className="surface rounded-lg p-6">
              <item.icon className="h-6 w-6 text-accent-strong" />
              <h3 className="mt-5 font-display text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Teams</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white">
                Find a roster that practices seriously.
              </h2>
            </div>
            <Link href="/teams" className="text-sm font-medium text-accent-strong">
              Browse teams
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {data.featuredTeams.slice(0, 3).map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
