import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarRange, MapPinned, MessageSquare, Shield, Swords } from "lucide-react";
import { LocalScheduleRange } from "@/components/local-schedule-range";
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
    <article className="rounded-lg border border-line bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold text-white">{block.teamName}</h3>
        </div>
        <ScrimStatusPill status={block.status} />
      </div>
      <div className="mt-5 space-y-3 text-sm text-muted">
        <p className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-accent-strong" />
          <LocalScheduleRange start={block.startTime} end={block.endTime} />
        </p>
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
          href={`/teams/${block.teamSlug}/scrims`}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
        >
          Team scrims
          <Swords className="h-4 w-4" />
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
          <h3 className="mt-2 font-display text-2xl font-bold text-white">{opponentName}</h3>
        </div>
        <ScrimStatusPill status={request.status} />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-3">
        <p className="flex items-center gap-2 sm:col-span-3">
          <CalendarRange className="h-4 w-4 text-accent-strong" />
          <LocalScheduleRange start={request.startTime} end={request.endTime} />
        </p>
        <p>{opponentRegion}</p>
        <p>
          <RankBadge badgeLevel={opponentRankBadgeLevel} rank={opponentRank} size="sm" />
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
