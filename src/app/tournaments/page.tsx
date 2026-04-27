import { BroadcastEmbed } from "@/components/live/broadcast-embed";
import { SiteHeader } from "@/components/navigation/site-header";
import { TournamentCard } from "@/components/tournament-card";
import { getCurrentUser } from "@/lib/auth";
import { getBroadcastCards, getTournamentCards } from "@/lib/platform-data";

export default async function TournamentsPage() {
  const [user, tournaments, broadcasts] = await Promise.all([
    getCurrentUser(),
    getTournamentCards(),
    getBroadcastCards(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="surface-strong rounded-lg p-8 md:p-10">
          <p className="eyebrow">Tournament Desk</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Registration links and live broadcasts on the same page.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This is the Scrimlock competitive-readiness layer: featured tournaments,
            quick-entry links, and Twitch embeds for the events high-level rosters are tracking.
          </p>
        </section>

        <section>
          <div className="mb-6">
            <p className="eyebrow">Featured Events</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">
              Tournament pipeline
            </h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="eyebrow">Broadcasts</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">
              Watch high-level play in real time
            </h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {broadcasts.map((broadcast) => (
              <BroadcastEmbed key={broadcast.id} broadcast={broadcast} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
