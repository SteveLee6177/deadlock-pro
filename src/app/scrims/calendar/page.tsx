import Link from "next/link";
import { Search, Users } from "lucide-react";
import { ScrimMatchManager } from "@/components/scrims/scrim-actions";
import { HourlyScrimCalendar } from "@/components/scrims/hourly-scrim-calendar";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import { UpcomingScrimList } from "@/components/scrims/scrim-summary-cards";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getScrimWorkspace } from "@/lib/scrim-data";

export default async function ScrimsCalendarPage() {
  const [user, workspace] = await Promise.all([getCurrentUser(), getScrimWorkspace()]);
  const pendingCount = workspace.incomingRequests.filter((request) => request.status === "PENDING").length;

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <ScrimNav active="calendar" pendingCount={pendingCount} />

        {workspace.team ? (
          <>
            <section className="surface-strong rounded-[36px] p-8 md:p-10">
              <p className="eyebrow">Calendar</p>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
                {workspace.team.name} scrim calendar
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Scroll each day by your browser&apos;s local time. Owners and managers can tap any plus sign to publish a one-hour Looking For Scrim block.
              </p>
            </section>

            <HourlyScrimCalendar
              events={workspace.calendarEvents}
              requests={[...workspace.incomingRequests, ...workspace.outgoingRequests]}
              teams={workspace.teams}
              selectedTeam={workspace.team}
            />

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="surface rounded-[28px] p-6">
                <p className="eyebrow">Calendar Rules</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Unmarked hours stay closed
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Only published Looking For Scrim blocks appear. Empty slots are treated as unavailable without adding extra clutter to the calendar.
                </p>
                <Link
                  href="/scrims/find"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                >
                  <Search className="h-4 w-4" />
                  Browse open blocks
                </Link>
              </div>

              <div className="surface rounded-[28px] p-6">
                <p className="eyebrow">Scheduled</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">Confirmed scrims</h2>
                <div className="mt-6">
                  <UpcomingScrimList
                    scrims={workspace.upcomingScrims}
                    teamId={workspace.team.id}
                    actions={
                      workspace.team.canManageScrims
                        ? (scrim) => <ScrimMatchManager scrim={scrim} />
                        : undefined
                    }
                  />
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="surface-strong rounded-[36px] p-8 md:p-10">
            <p className="eyebrow">Calendar</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              Join or create a team to schedule scrims.
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/teams#create-team"
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
