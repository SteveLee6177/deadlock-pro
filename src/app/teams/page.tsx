import { CreateTeamForm } from "@/components/create-team-form";
import { SiteHeader } from "@/components/navigation/site-header";
import { TeamCard } from "@/components/team-card";
import { getCurrentUser } from "@/lib/auth";
import { getTeamsDirectory } from "@/lib/platform-data";

export default async function TeamsPage() {
  const [user, teams] = await Promise.all([getCurrentUser(), getTeamsDirectory()]);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-strong rounded-[36px] p-8 md:p-10">
            <p className="eyebrow">Team Directory</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              Recruit around fit, schedule, and competitive goals.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Players can scout team culture, rank targets, and open roles before they reach out.
              Team captains can spin up a roster hub and start collecting applicants.
            </p>
          </div>

          <CreateTeamForm disabled={!user} />
        </section>

        {!user ? (
          <div className="surface rounded-[28px] p-5 text-sm text-muted">
            Sign in with Steam to create a team or submit an application. The directory still
            loads from demo or database data so you can explore the product flow without setup
            blockers.
          </div>
        ) : null}

        <section>
          <div className="mb-6">
            <p className="eyebrow">Recruiting Teams</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">
              Browse active rosters
            </h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
