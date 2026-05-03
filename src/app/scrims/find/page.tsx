import Link from "next/link";
import { Search, Users } from "lucide-react";
import { RequestScrimButton } from "@/components/scrims/scrim-actions";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import {
  AvailabilityBlockCard,
  EmptyScrimState,
} from "@/components/scrims/scrim-summary-cards";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import {
  getCurrentScrimTeams,
  getOpenAvailabilityBlocks,
  getScrimWorkspace,
  removeDeclinedMatchupBlocks,
} from "@/lib/scrim-data";

export default async function FindScrimsPage() {
  const [user, teams, blocks, workspace] = await Promise.all([
    getCurrentUser(),
    getCurrentScrimTeams(),
    getOpenAvailabilityBlocks(),
    getScrimWorkspace(),
  ]);
  const currentCount = workspace.upcomingScrims.length;
  const incomingCount = workspace.incomingRequests.length;
  const sentCount = workspace.outgoingRequests.length;
  const ownTeamIds = new Set(teams.map((team) => team.id));
  const visibleBlocks = await removeDeclinedMatchupBlocks(
    blocks.filter((block) => !ownTeamIds.has(block.teamId)),
    teams.map((team) => team.id),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <ScrimNav
          active="find"
          currentCount={currentCount}
          incomingCount={incomingCount}
          sentCount={sentCount}
        />

        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Find Scrims</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white">
              {visibleBlocks.length} open scrim block{visibleBlocks.length === 1 ? "" : "s"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Open blocks from your own teams are hidden here so the board stays focused.
            </p>
          </div>
          {teams.length === 0 ? (
            <div className="flex flex-wrap gap-3">
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
          ) : null}
        </section>

        <section>
          <div className="grid gap-6 xl:grid-cols-2">
            {visibleBlocks.map((block) => (
              <AvailabilityBlockCard
                key={block.id}
                block={block}
                action={<RequestScrimButton block={block} teams={teams} />}
              />
            ))}
            {visibleBlocks.length === 0 ? (
              <EmptyScrimState
                title="No open blocks"
                detail="When another team publishes a Looking For Scrim block, it will appear here immediately."
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
