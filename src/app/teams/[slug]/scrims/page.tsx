import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Search } from "lucide-react";
import {
  AvailabilityBlockManager,
  RequestScrimButton,
  RequestActions,
  ScrimAvailabilityForm,
  ScrimMatchManager,
} from "@/components/scrims/scrim-actions";
import { ScrimCalendarBoard } from "@/components/scrims/scrim-calendar-board";
import {
  AvailabilityBlockCard,
  EmptyScrimState,
  RequestCard,
  UpcomingScrimList,
} from "@/components/scrims/scrim-summary-cards";
import { ScrimChatButton } from "@/components/scrims/scrim-chat-button";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentScrimTeams, getTeamScrimPage } from "@/lib/scrim-data";

export default async function TeamScrimsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const [pageData, currentTeams] = await Promise.all([
    getTeamScrimPage(slug, user?.id),
    getCurrentScrimTeams(),
  ]);

  if (!pageData) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href={`/teams/${pageData.team.slug}`}
          className="inline-flex items-center gap-2 text-sm text-accent-strong"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to team profile
        </Link>

        <section className="surface-strong rounded-lg p-8 md:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="eyebrow">Team Scrims</p>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
                {pageData.team.name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                {pageData.isMember
                  ? "Team members can see the full scrim calendar, confirmed sets, and request status."
                  : "Public open availability is visible here. Private scrims stay limited to team members."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                  {pageData.team.region}
                </span>
                <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
                  {pageData.team.primaryRank}
                </span>
                {pageData.role ? (
                  <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                    {pageData.role}
                  </span>
                ) : null}
              </div>
            </div>
            {pageData.canManage ? (
              <Link
                href="#create-availability"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
              >
                <CalendarPlus className="h-4 w-4" />
                Create Availability
              </Link>
            ) : (
              <Link
                href="/scrims/find"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
              >
                <Search className="h-4 w-4" />
                Find Scrims
              </Link>
            )}
          </div>
        </section>

        {pageData.isMember ? (
          <>
            <ScrimCalendarBoard events={pageData.calendarEvents} />

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="surface rounded-lg p-6">
                <p className="eyebrow">Confirmed Scrims</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Upcoming matches
                </h2>
                <div className="mt-6">
                  <UpcomingScrimList
                    scrims={pageData.upcomingScrims}
                    teamId={pageData.team.id}
                    actions={
                      pageData.canManage
                        ? (scrim) => (
                            <div className="flex flex-wrap items-center gap-3">
                              <ScrimChatButton entity={{ kind: "scrim", id: scrim.id }} />
                              <ScrimMatchManager scrim={scrim} />
                            </div>
                          )
                        : undefined
                    }
                  />
                </div>
              </div>
              <div className="surface rounded-lg p-6">
                <p className="eyebrow">Pending Requests</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">Team queue</h2>
                <div className="mt-6 space-y-4">
                  {[...pageData.incomingRequests, ...pageData.outgoingRequests]
                    .filter((request) => request.status === "PENDING")
                    .map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        direction={request.receivingTeamId === pageData.team.id ? "incoming" : "outgoing"}
                        actions={
                          pageData.canManage ? (
                            <>
                              {request.receivingTeamId === pageData.team.id &&
                              request.status === "PENDING" ? (
                                <RequestActions requestId={request.id} />
                              ) : null}
                            </>
                          ) : undefined
                        }
                      />
                    ))}
                  {pageData.incomingRequests.filter((request) => request.status === "PENDING").length +
                    pageData.outgoingRequests.filter((request) => request.status === "PENDING").length ===
                  0 ? (
                    <EmptyScrimState
                      title="No pending requests"
                      detail="Pending request activity for this team will appear here."
                    />
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="surface rounded-lg p-6">
            <p className="eyebrow">Open Availability</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">
              Public scrim blocks
            </h2>
            <div className="mt-6 grid gap-4">
              {pageData.availabilityBlocks.map((block) => (
                <AvailabilityBlockCard
                  key={block.id}
                  block={block}
                  action={
                    pageData.canManage ? (
                      <AvailabilityBlockManager block={block} />
                    ) : (
                      <RequestScrimButton block={block} teams={currentTeams} />
                    )
                  }
                />
              ))}
              {pageData.availabilityBlocks.length === 0 ? (
                <EmptyScrimState
                  title="No public availability"
                  detail="This team does not have an open scrim block right now."
                />
              ) : null}
            </div>
          </div>

          <div id="create-availability">
            {pageData.canManage ? (
              <ScrimAvailabilityForm teams={currentTeams} />
            ) : (
              <div className="surface rounded-lg p-6">
                <p className="eyebrow">Request Access</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Official requests need team permissions
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Owners and managers can request one of this team&apos;s open blocks from a team they manage.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
