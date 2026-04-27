import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { SiteHeader } from "@/components/navigation/site-header";
import { ScheduleList } from "@/components/schedule-list";
import { TeamJoinForm } from "@/components/team-join-form";
import { getCurrentUser } from "@/lib/auth";
import { getTeamProfile } from "@/lib/platform-data";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, team] = await Promise.all([getCurrentUser(), getTeamProfile(slug)]);

  if (!team) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-accent-strong">
          <ArrowLeft className="h-4 w-4" />
          Back to team directory
        </Link>

        <section className="grid gap-8 xl:grid-cols-[1fr_0.85fr]">
          <div className="surface-strong rounded-lg p-8 md:p-10">
            <p className="eyebrow">{team.tag}</p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              {team.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                {team.region}
              </span>
              <span className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-success">
                {team.primaryRank}
              </span>
              <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                {team.availability}
              </span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{team.description}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{team.focus}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {team.openRoles.length > 0 ? (
                team.openRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-slate-100"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-muted">
                  Closed roster
                </span>
              )}
            </div>
          </div>

          {user ? (
            <TeamJoinForm slug={team.slug} disabled={false} />
          ) : (
            <GuestAccessCard
              eyebrow="View Only"
              title="Trial requests unlock after Steam sign-in"
              description="Roster standards stay visible for guests, but requesting a tryout block requires a signed-in Steam identity."
            />
          )}
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="surface rounded-lg p-6">
            <p className="eyebrow">Roster</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">Current members</h2>
            <div className="mt-6 space-y-4">
              {team.members.map((member) => (
                <div key={member.id} className="rounded-lg border border-line bg-white/5 p-4">
                  <p className="font-medium text-white">{member.profileName}</p>
                  <p className="mt-1 text-sm text-muted">{member.role}</p>
                  {member.deadlockRank ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-accent-strong">
                      {member.deadlockRank}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <p className="eyebrow">Upcoming Schedule</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                Practice, scrim, and review blocks
              </h2>
            </div>
            <ScheduleList events={team.upcomingSchedule} />
          </div>
        </section>
      </main>
    </div>
  );
}
