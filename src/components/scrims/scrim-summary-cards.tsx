import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, CalendarRange, MapPinned, MessageSquare, Shield, Swords, Users } from "lucide-react";
import {
  LocalCompactDate,
  LocalCompactTimeRange,
  LocalScheduleRange,
} from "@/components/local-schedule-range";
import { RankBadge } from "@/components/rank-badge";
import { ScrimStatusPill } from "@/components/scrims/scrim-status-pill";
import type {
  ScrimAvailabilitySummary,
  ScrimMatchSummary,
  ScrimRequestSummary,
} from "@/lib/types";

export function EmptyScrimState({
  title,
  detail,
  href,
  action,
}: {
  title: string;
  detail: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white/5 p-5 text-sm">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 leading-6 text-muted">{detail}</p>
      {href && action ? (
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
        >
          <Swords className="h-4 w-4" />
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function UpcomingScrimList({
  scrims,
  teamId,
  actions,
}: {
  scrims: ScrimMatchSummary[];
  teamId?: string;
  actions?: (scrim: ScrimMatchSummary) => ReactNode;
}) {
  if (scrims.length === 0) {
    return (
      <EmptyScrimState
        title="No confirmed scrims yet"
        detail="Accepted requests will show here first so players can quickly see what is scheduled."
        href="/scrims/find"
        action="Find scrims"
      />
    );
  }

  return (
    <div className="space-y-3">
      {scrims.map((scrim) => {
        const opponent = teamId && scrim.teamAId === teamId ? scrim.teamBName : scrim.teamAName;

        return (
          <article key={scrim.id} className="rounded-lg border border-line bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent-strong">
                  Confirmed Scrim
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">
                  vs {opponent}
                </h3>
              </div>
              <ScrimStatusPill status={scrim.status} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <CalendarRange className="h-4 w-4 text-accent-strong" />
              <LocalScheduleRange start={scrim.startTime} end={scrim.endTime} />
            </p>
            {scrim.notes ? <p className="mt-3 text-sm leading-6 text-slate-300">{scrim.notes}</p> : null}
            {actions ? <div className="mt-5">{actions(scrim)}</div> : null}
          </article>
        );
      })}
    </div>
  );
}

export function AvailabilityBlockCard({
  block,
  action,
}: {
  block: ScrimAvailabilitySummary;
  action?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-line bg-white/5 p-5 transition hover:border-accent/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/teams/${block.teamSlug}`}
            className="font-display text-2xl font-bold text-white transition hover:text-accent-strong"
          >
            {block.teamName}
            <ArrowUpRight className="ml-2 inline h-4 w-4 align-[-1px]" />
          </Link>
        </div>
        <ScrimStatusPill status={block.status} />
      </div>

      <div className="mt-5 rounded-lg border border-accent/35 bg-accent/10 px-4 py-3">
        <p className="font-display text-5xl font-bold leading-none text-white">
          <LocalCompactTimeRange start={block.startTime} end={block.endTime} />
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-accent-strong">
          <CalendarRange className="h-4 w-4" />
          <LocalCompactDate value={block.startTime} />
        </p>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-accent-strong" />
          {block.region}
        </p>
        <p className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent-strong" />
          <RankBadge badgeLevel={block.rankBadgeLevel} rank={block.rank} size="sm" />
        </p>
      </div>
      {block.notes ? <p className="mt-4 text-sm leading-6 text-slate-300">{block.notes}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {action}
        <Link
          href={`/teams/${block.teamSlug}`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-accent/50 bg-accent/15 px-4 text-sm font-semibold text-accent-strong transition hover:bg-accent/25 hover:text-white"
        >
          <Users className="h-4 w-4" />
          View Roster
        </Link>
      </div>
    </article>
  );
}

export function RequestCard({
  request,
  direction,
  actions,
}: {
  request: ScrimRequestSummary;
  direction: "incoming" | "outgoing";
  actions?: ReactNode;
}) {
  const opponentName =
    direction === "incoming" ? request.requestingTeamName : request.receivingTeamName;
  const opponentSlug =
    direction === "incoming" ? request.requestingTeamSlug : request.receivingTeamSlug;
  const opponentRegion =
    direction === "incoming" ? request.requestingTeamRegion : request.receivingTeamRegion;
  const opponentRank =
    direction === "incoming" ? request.requestingTeamRank : request.receivingTeamRank;
  const opponentRankBadgeLevel =
    direction === "incoming"
      ? request.requestingTeamRankBadgeLevel
      : request.receivingTeamRankBadgeLevel;

  return (
    <article className="rounded-lg border border-line bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-strong">
            {direction === "incoming" ? "From" : "To"}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">
            <Link
              href={`/teams/${opponentSlug}#roster`}
              className="transition hover:text-accent-strong"
            >
              {opponentName}
              <ArrowUpRight className="ml-2 inline h-4 w-4 align-[-1px]" />
            </Link>
          </h3>
        </div>
        <ScrimStatusPill status={request.status} />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-3">
        <p className="flex min-h-8 items-center gap-2 sm:col-span-3">
          <CalendarRange className="h-4 w-4 text-accent-strong" />
          <LocalScheduleRange start={request.startTime} end={request.endTime} />
        </p>
        <p className="flex min-h-8 items-center gap-2">
          <MapPinned className="h-4 w-4 text-accent-strong" />
          {opponentRegion}
        </p>
        <p className="flex min-h-8 items-center gap-2">
          <Shield className="h-4 w-4 text-accent-strong" />
          <RankBadge
            badgeLevel={opponentRankBadgeLevel}
            className="shrink-0"
            rank={opponentRank}
            size="sm"
          />
          <span>{opponentRank}</span>
        </p>
      </div>
      {request.message ? (
        <p className="mt-4 flex gap-2 text-sm leading-6 text-slate-300">
          <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-accent-strong" />
          {request.message}
        </p>
      ) : null}
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </article>
  );
}
