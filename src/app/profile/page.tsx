import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserTeams } from "@/lib/platform-data";

export default async function ProfilePage() {
  const [user, teams] = await Promise.all([getCurrentUser(), getCurrentUserTeams()]);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {user ? (
          <>
            <section className="surface-strong rounded-[36px] p-8 md:p-10">
              <p className="eyebrow">Profile</p>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
                {user.profileName}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                  Steam connected
                </span>
                {user.deadlockRank ? (
                  <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
                    {user.deadlockRank}
                  </span>
                ) : null}
              </div>
            </section>

            <section className="surface rounded-[28px] p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent-strong" />
                <div>
                  <p className="eyebrow">Teams</p>
                  <h2 className="mt-1 font-display text-3xl font-bold text-white">
                    Your roster status
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams?setup=${team.slug}`}
                      className="flex items-center justify-between gap-4 rounded-[22px] border border-line bg-white/5 p-4 transition hover:border-accent/40"
                    >
                      <div>
                        <p className="font-medium text-white">{team.name}</p>
                        <p className="mt-1 text-sm text-muted">
                          {team.tag} · {team.role}
                        </p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-accent-strong" />
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-line bg-white/5 p-4">
                    <p className="text-sm text-muted">You are not on a team yet.</p>
                    <Link
                      href="/teams"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                    >
                      Browse teams
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <GuestAccessCard
            eyebrow="Sign In Required"
            title="Connect Steam to see your profile"
            description="Your profile shows roster status, rank, and team shortcuts once you sign in."
          />
        )}
      </main>
    </div>
  );
}
