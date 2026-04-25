import { LiveScheduleBoard } from "@/components/live/live-schedule-board";
import { ScrimPlanner } from "@/components/live/scrim-planner";
import { SiteHeader } from "@/components/navigation/site-header";
import { ScrimCard } from "@/components/scrim-card";
import { getCurrentUser } from "@/lib/auth";
import { hasRedis } from "@/lib/env";
import { getOpenScrims, getScheduleFeed, getTeamsDirectory } from "@/lib/platform-data";

export default async function ScrimsPage() {
  const [user, scrims, schedule, teams] = await Promise.all([
    getCurrentUser(),
    getOpenScrims(),
    getScheduleFeed(),
    getTeamsDirectory(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="surface-strong rounded-[36px] p-8 md:p-10">
          <p className="eyebrow">Scrim Board</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Schedule blocks, post requests, and keep calendars in sync.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The scrim flow is split into two jobs: making open requests visible and pushing
            confirmed schedule changes across the team feed instantly through Redis and SSE.
          </p>
        </section>

        <ScrimPlanner teams={teams} disabled={!user} />

        <section>
          <div className="mb-6">
            <p className="eyebrow">Open Requests</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">
              Teams actively looking for sets
            </h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {scrims.map((scrim) => (
              <ScrimCard key={scrim.id} scrim={scrim} />
            ))}
          </div>
        </section>

        <LiveScheduleBoard initialEvents={schedule} liveEnabled={hasRedis()} />
      </main>
    </div>
  );
}
