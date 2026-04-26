import Link from "next/link";
import { ClipboardList, Search, Users } from "lucide-react";
import {
  RequestScrimButton,
  ScrimMatchManager,
} from "@/components/scrims/scrim-actions";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import {
  AvailabilityBlockCard,
  EmptyScrimState,
  RequestCard,
  UpcomingScrimList,
} from "@/components/scrims/scrim-summary-cards";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getScrimWorkspace } from "@/lib/scrim-data";

export default async function ScrimsPage() {
  const [user, workspace] = await Promise.all([getCurrentUser(), getScrimWorkspace()]);
  const pendingCount = workspace.incomingRequests.filter((request) => request.status === "PENDING").length;
  const canManage = Boolean(workspace.team?.canManageScrims);
  const ownTeamIds = new Set(workspace.teams.map((team) => team.id));
  const publicOpenBlocks = workspace.openBlocks.filter((block) => !ownTeamIds.has(block.teamId));

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <ScrimNav active="overview" pendingCount={pendingCount} />

        {workspace.team ? (
          <>
            <section className="surface-strong rounded-[36px] p-8 md:p-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="eyebrow">Scrims</p>
                  <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
                    {canManage ? "Requests, blocks, and confirmed sets." : "Your team scrim calendar."}
                  </h1>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                    {canManage
                      ? `${workspace.team.name} has ${pendingCount} incoming request${
                          pendingCount === 1 ? "" : "s"
                        } waiting for review.`
                      : `${workspace.team.name} scrims are collected here so players can see what is scheduled first.`}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                      {workspace.team.region}
                    </span>
                    <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
                      {workspace.team.primaryRank}
                    </span>
                    <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                      {workspace.team.role}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/scrims/calendar"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                  >
                    Open Calendar
                  </Link>
                  <Link
                    href="/scrims/find"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                  >
                    <Search className="h-4 w-4" />
                    Find Scrims
                  </Link>
                </div>
              </div>
            </section>

            <section className="surface rounded-[28px] p-6">
              <p className="eyebrow">Upcoming Scrims</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                Confirmed schedule
              </h2>
              <div className="mt-6">
                <UpcomingScrimList
                  scrims={workspace.upcomingScrims}
                  teamId={workspace.team.id}
                  actions={canManage ? (scrim) => <ScrimMatchManager scrim={scrim} /> : undefined}
                />
              </div>
            </section>

            <section className="surface rounded-[28px] p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Open Scrim Blocks</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-white">
                    Other teams looking for scrims
                  </h2>
                </div>
                <Link
                  href="/scrims/find"
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
                >
                  Browse all
                  <Search className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {publicOpenBlocks.slice(0, 4).map((block) => (
                  <AvailabilityBlockCard
                    key={block.id}
                    block={block}
                    action={<RequestScrimButton block={block} teams={workspace.teams} />}
                  />
                ))}
                {publicOpenBlocks.length === 0 ? (
                  <EmptyScrimState
                    title="No other teams open"
                    detail="When other teams publish Looking For Scrim blocks, they will appear here."
                  />
                ) : null}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="surface rounded-[28px] p-6">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-accent-strong" />
                  <div>
                    <p className="eyebrow">Incoming Requests</p>
                    <h2 className="mt-1 font-display text-3xl font-bold text-white">
                      Needs action
                    </h2>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {workspace.incomingRequests.slice(0, 3).map((request) => (
                    <RequestCard key={request.id} request={request} direction="incoming" />
                  ))}
                  {workspace.incomingRequests.length === 0 ? (
                    <EmptyScrimState
                      title="No incoming requests"
                      detail="Requests from other teams will appear here and on the Requests page."
                    />
                  ) : null}
                </div>
              </div>

              <div className="surface rounded-[28px] p-6">
                <p className="eyebrow">Outgoing Requests</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">Sent by your team</h2>
                <div className="mt-6 space-y-4">
                  {workspace.outgoingRequests.slice(0, 3).map((request) => (
                    <RequestCard key={request.id} request={request} direction="outgoing" />
                  ))}
                  {workspace.outgoingRequests.length === 0 ? (
                    <EmptyScrimState
                      title="No outgoing requests"
                      detail="Use Find Scrims to request one of another team's open blocks."
                      href="/scrims/find"
                      action="Find scrims"
                    />
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="surface-strong rounded-[36px] p-8 md:p-10">
              <p className="eyebrow">Scrims</p>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
                Join or create a team to schedule scrims.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Public availability stays visible, but official requests need a team owner or manager.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/teams#create-team"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                >
                  <Users className="h-4 w-4" />
                  Create Team
                </Link>
                <Link
                  href="/teams#browse-teams"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                >
                  <Search className="h-4 w-4" />
                  Browse Teams
                </Link>
              </div>
            </section>

            <section>
              <div className="mb-6">
                <p className="eyebrow">Public Blocks</p>
                <h2 className="mt-2 font-display text-4xl font-bold text-white">
                  Teams looking for scrims
                </h2>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                {workspace.openBlocks.map((block) => (
                  <AvailabilityBlockCard key={block.id} block={block} />
                ))}
                {workspace.openBlocks.length === 0 ? (
                  <EmptyScrimState
                    title="No public blocks yet"
                    detail="Teams will appear here when they publish Looking For Scrim blocks."
                  />
                ) : null}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
