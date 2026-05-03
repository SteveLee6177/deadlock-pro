import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { CreateTeamForm } from "@/components/create-team-form";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserTeams } from "@/lib/platform-data";

export default async function CreateTeamPage() {
  const [user, teams] = await Promise.all([getCurrentUser(), getCurrentUserTeams()]);
  const primaryTeam = teams[0] ?? null;
  const ownTeamHref = primaryTeam?.role === "OWNER" ? `/teams?team=${primaryTeam.slug}` : "/teams";

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-accent-strong">
          <ArrowLeft className="h-4 w-4" />
          Back to teams
        </Link>

        <section className="border-b border-line/60 pb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-line bg-white/5 p-3 text-accent-strong">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Create Team</p>
              <h1 className="mt-2 font-display text-5xl font-bold tracking-tight text-white">
                Create a team.
              </h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Set the roster basics, then choose whether this team is actively recruiting on-site or already assembled.
          </p>
        </section>

        {primaryTeam ? (
          <GuestAccessCard
            eyebrow="Team Ready"
            title="You already have a team"
            description="Jump back to your team page to manage recruiting needs, roster details, and scrim access."
            ctaLabel="Open My Team"
            ctaHref={ownTeamHref}
          />
        ) : user ? (
          <div className="max-w-3xl">
            <CreateTeamForm disabled={false} />
          </div>
        ) : (
          <GuestAccessCard
            eyebrow="Steam Required"
            title="Sign in before creating a team"
            description="Players can browse teams without signing in, but creating a team requires a verified Steam identity."
          />
        )}
      </main>
    </div>
  );
}
