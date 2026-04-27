import Link from "next/link";
import { ArrowUpRight, CalendarRange, Ticket, Trophy } from "lucide-react";
import type { TournamentCard as TournamentCardType } from "@/lib/types";

export function TournamentCard({ tournament }: { tournament: TournamentCardType }) {
  return (
    <article className="surface rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent-strong">
            {tournament.organizer}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">{tournament.name}</h3>
        </div>
        {tournament.featured ? (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-strong">
            Featured
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-3 text-sm text-muted">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-accent-strong" />
          {new Date(tournament.startsAt).toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent-strong" />
          {tournament.format} · {tournament.region}
        </div>
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-accent-strong" />
          {tournament.platform}
          {tournament.prizePool ? ` · ${tournament.prizePool}` : ""}
        </div>
      </div>

      {tournament.entryRequirements ? (
        <p className="mt-5 text-sm leading-7 text-slate-200">{tournament.entryRequirements}</p>
      ) : null}

      <Link
        href={tournament.registrationUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
      >
        Open registration
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
