import Link from "next/link";
import { Search, Users } from "lucide-react";
import { RequestActions } from "@/components/scrims/scrim-actions";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import {
  EmptyScrimState,
  RequestCard,
  UpcomingScrimList,
} from "@/components/scrims/scrim-summary-cards";
import { getScrimWorkspace } from "@/lib/scrim-data";

type ScrimRequestsPageProps = {
  searchParams?: Promise<{
    team?: string | string[];
  }>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ScrimRequestsPage({ searchParams }: ScrimRequestsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const workspace = await getScrimWorkspace(asString(resolvedSearchParams.team));
  const currentCount = workspace.upcomingScrims.length;
  const incomingCount = workspace.incomingRequests.length;
  const sentCount = workspace.outgoingRequests.length;
  const canManage = Boolean(workspace.team?.canManageScrims);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <ScrimNav
        active="incoming"
        currentCount={currentCount}
        incomingCount={incomingCount}
        sentCount={sentCount}
      />

      {workspace.team ? (
        <>
          <section className="surface-strong rounded-lg p-8 md:p-10">
            <p className="eyebrow">Scrim Queues</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              {canManage
                ? "Accept, decline, and track scrim requests."
                : "Scrim requests are read-only."}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              {canManage
                ? "Incoming requests become confirmed scrims once accepted and appear on both team calendars."
                : "Players can follow request status and confirmed scrims without management controls."}
            </p>
          </section>

          {canManage ? (
            <section className="grid gap-6 xl:grid-cols-2">
              <div id="incoming" className="surface rounded-lg p-6">
                <p className="eyebrow">Incoming Scrims ({incomingCount})</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Review queue
                </h2>
                <div className="mt-6 space-y-4">
                  {workspace.incomingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      direction="incoming"
                      actions={
                        request.status === "PENDING" ? (
                          <RequestActions requestId={request.id} />
                        ) : undefined
                      }
                    />
                  ))}
                  {workspace.incomingRequests.length === 0 ? (
                    <EmptyScrimState
                      title="No incoming scrims"
                      detail="Requests from other teams will appear here as soon as they ask for one of your blocks."
                    />
                  ) : null}
                </div>
              </div>

              <div id="sent" className="surface rounded-lg p-6">
                <p className="eyebrow">Sent Scrims ({sentCount})</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Sent requests
                </h2>
                <div className="mt-6 space-y-4">
                  {workspace.outgoingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      direction="outgoing"
                      actions={
                        request.status === "PENDING" ? (
                          <RequestActions mode="outgoing" requestId={request.id} />
                        ) : undefined
                      }
                    />
                  ))}
                  {workspace.outgoingRequests.length === 0 ? (
                    <EmptyScrimState
                      title="No sent scrims"
                      detail="Browse public availability and send a request from a manager-controlled team."
                      href="/scrims/find"
                      action="Find scrims"
                    />
                  ) : null}
                </div>
              </div>
            </section>
          ) : (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="surface rounded-lg p-6">
                <p className="eyebrow">Upcoming Scrims</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Confirmed schedule
                </h2>
                <div className="mt-6">
                  <UpcomingScrimList
                    scrims={workspace.upcomingScrims}
                    teamId={workspace.team.id}
                  />
                </div>
              </div>
              <div className="surface rounded-lg p-6">
                <p className="eyebrow">
                  Incoming Scrims ({incomingCount}) · Sent Scrims ({sentCount})
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Read-only queue
                </h2>
                <div className="mt-6 space-y-4">
                  {[
                    ...workspace.incomingRequests,
                    ...workspace.outgoingRequests,
                  ].map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      direction={
                        request.receivingTeamId === workspace.team?.id
                          ? "incoming"
                          : "outgoing"
                      }
                    />
                  ))}
                  {workspace.incomingRequests.length +
                    workspace.outgoingRequests.length ===
                  0 ? (
                    <EmptyScrimState
                      title="No request activity"
                      detail="Confirmed scrims will still appear here and on the calendar."
                    />
                  ) : null}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="surface-strong rounded-lg p-8 md:p-10">
          <p className="eyebrow">Scrim Queues</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Join or create a team to request scrims.
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
  );
}
