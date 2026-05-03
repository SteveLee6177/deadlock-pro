import Link from "next/link";
import { Search, Users } from "lucide-react";
import { HourlyScrimCalendar } from "@/components/scrims/hourly-scrim-calendar";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getScrimWorkspace } from "@/lib/scrim-data";

export default async function ScrimsCalendarPage() {
  const [user, workspace] = await Promise.all([getCurrentUser(), getScrimWorkspace()]);
  const currentCount = workspace.upcomingScrims.length;
  const incomingCount = workspace.incomingRequests.length;
  const sentCount = workspace.outgoingRequests.length;

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <ScrimNav
          active="calendar"
          currentCount={currentCount}
          incomingCount={incomingCount}
          sentCount={sentCount}
        />

        {workspace.team ? (
          <>
            <section className="flex flex-col gap-2 border-b border-line/60 pb-4">
              <p className="eyebrow">Calendar</p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                {workspace.team.name} scrim calendar
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted">
                Times are shown locally. Owners and managers can use open hours to post one-hour Looking For Scrim blocks.
              </p>
            </section>

            <HourlyScrimCalendar
              events={workspace.calendarEvents}
              requests={workspace.outgoingRequests}
              teams={workspace.teams}
              selectedTeam={workspace.team}
            />

          </>
        ) : (
          <section className="surface-strong rounded-lg p-8 md:p-10">
            <p className="eyebrow">Calendar</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              Join or create a team to schedule scrims.
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/teams/create"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
              >
                <Users className="h-4 w-4" />
                Create Team
              </Link>
              <Link
                href="/scrims/find"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
              >
                <Search className="h-4 w-4" />
                View public blocks
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
