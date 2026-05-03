import Link from "next/link";
import { Search, Users } from "lucide-react";
import { ScrimMatchManager } from "@/components/scrims/scrim-actions";
import { ScrimChatButton } from "@/components/scrims/scrim-chat-button";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import {
  EmptyScrimState,
  UpcomingScrimList,
} from "@/components/scrims/scrim-summary-cards";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getScrimWorkspace } from "@/lib/scrim-data";

export default async function CurrentScrimsPage() {
  const [user, workspace] = await Promise.all([getCurrentUser(), getScrimWorkspace()]);
  const currentCount = workspace.upcomingScrims.length;
  const incomingCount = workspace.incomingRequests.length;
  const sentCount = workspace.outgoingRequests.length;
  const canManage = Boolean(workspace.team?.canManageScrims);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <ScrimNav
          active="current"
          currentCount={currentCount}
          incomingCount={incomingCount}
          sentCount={sentCount}
        />

        {workspace.team ? (
          <>
            <section className="flex flex-col gap-3 border-b border-line/60 pb-5">
              <p className="eyebrow">Current Scrims</p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-white">
                {currentCount} scheduled scrim{currentCount === 1 ? "" : "s"}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted">
                Accepted scrims live here after they leave the incoming request queue.
              </p>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.55fr]">
              <div className="surface rounded-lg p-6">
                <p className="eyebrow">Scheduled</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Confirmed matchups
                </h2>
                <div className="mt-6">
                  {workspace.upcomingScrims.length > 0 ? (
                    <UpcomingScrimList
                      scrims={workspace.upcomingScrims}
                      teamId={workspace.team.id}
                      actions={
                        canManage
                          ? (scrim) => (
                              <div className="flex flex-wrap items-center gap-3">
                                <ScrimChatButton entity={{ kind: "scrim", id: scrim.id }} />
                                <ScrimMatchManager scrim={scrim} />
                              </div>
                            )
                          : undefined
                      }
                    />
                  ) : (
                    <EmptyScrimState
                      title="No current scrims"
                      detail="Accepted scrim requests will appear here with their schedule and chat."
                      href="/scrims/find"
                      action="Find scrims"
                    />
                  )}
                </div>
              </div>

              <aside className="surface rounded-lg p-6">
                <p className="eyebrow">Request Queue</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Pending only
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Incoming scrims now only shows teams actively requesting a new scrim from your team.
                </p>
                <Link
                  href="/scrims/requests#incoming"
                  className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                >
                  View incoming scrims
                </Link>
              </aside>
            </section>
          </>
        ) : (
          <section className="surface-strong rounded-lg p-8 md:p-10">
            <p className="eyebrow">Current Scrims</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              Join or create a team to view current scrims.
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
