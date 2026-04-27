import Link from "next/link";
import { ArrowUpRight, Flag, Radar, ShieldCheck, Users } from "lucide-react";
import type { TeamSummary } from "@/lib/types";

export function TeamCard({
  team,
  showQuickApply = false,
}: {
  team: TeamSummary;
  showQuickApply?: boolean;
}) {
  return (
    <article className="surface rounded-lg p-6 transition hover:-translate-y-1 hover:border-accent/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent-strong">{team.tag}</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">{team.name}</h3>
          <p className="mt-2 text-sm text-muted">{team.region}</p>
        </div>
        <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          {team.primaryRank}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-200">{team.description}</p>

      <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent-strong" />
          {team.memberCount} members
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-accent-strong" />
          {team.availability}
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Radar className="h-4 w-4 text-accent-strong" />
          {team.focus}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {team.openRoles.length > 0 ? (
          team.openRoles.map((role) => (
            <span
              key={role}
              className="rounded-md border border-line bg-white/5 px-3 py-1 text-xs text-slate-100"
            >
              {role}
            </span>
          ))
        ) : (
          <span className="rounded-md border border-line bg-white/5 px-3 py-1 text-xs text-muted">
            Closed roster
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {showQuickApply && team.recruiting ? (
          <Link
            href={`/teams/${team.slug}#apply`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            <ShieldCheck className="h-4 w-4" />
            Request tryout
          </Link>
        ) : null}
        <Link
          href={`/teams/${team.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
        >
          View roster
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
