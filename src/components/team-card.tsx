"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Flag, Radar, Send, Users } from "lucide-react";
import { RankBadge } from "@/components/rank-badge";
import type { TeamSummary } from "@/lib/types";

function hasApplied(status: string | null | undefined) {
  return status === "PENDING" || status === "APPROVED";
}

function applicationFeedback(status: string | null | undefined) {
  return status === "APPROVED" ? "Invite available in profile" : "Application sent";
}

export function TeamCard({
  canViewProfile = true,
  team,
  showQuickApply = false,
}: {
  canViewProfile?: boolean;
  team: TeamSummary;
  showQuickApply?: boolean;
}) {
  const router = useRouter();
  const [applicationStatus, setApplicationStatus] = useState(team.currentUserApplicationStatus);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const applied = hasApplied(applicationStatus);
  const showApplyButton =
    showQuickApply && team.recruiting && team.currentUserCanApply !== false;

  function applyToTeam() {
    startTransition(async () => {
      const response = await fetch(`/api/teams/${team.slug}/apply`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (response.ok) {
        setApplicationStatus("PENDING");
        setFeedback(payload?.message ?? "Application sent.");
        router.refresh();
      } else {
        setFeedback(payload?.message ?? "Unable to apply.");
      }
    });
  }

  return (
    <article className="surface rounded-lg p-6 transition hover:-translate-y-1 hover:border-accent/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white">{team.name}</h3>
          <p className="mt-2 text-sm text-muted">{team.region}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
          <RankBadge badgeLevel={team.primaryRankBadgeLevel} rank={team.primaryRank} size="sm" />
        </span>
      </div>

      {team.description ? (
        <p className="mt-5 text-sm leading-7 text-slate-200">{team.description}</p>
      ) : null}

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
        {showApplyButton ? (
          <button
            type="button"
            onClick={applyToTeam}
            disabled={isPending || applied}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-success/20 disabled:text-success"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Applying..." : applied ? "Applied" : "Apply to join"}
          </button>
        ) : null}
        {canViewProfile ? (
          <Link
            href={`/teams/${team.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-strong transition hover:text-white"
          >
            View roster
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {applied ? (
        <p className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
          {applicationFeedback(applicationStatus)}
        </p>
      ) : feedback ? (
        <p className="mt-4 text-sm text-muted">{feedback}</p>
      ) : null}
    </article>
  );
}
