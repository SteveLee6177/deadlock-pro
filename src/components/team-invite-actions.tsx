"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, LogOut, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type TeamInviteActionsProps = {
  currentTeamName?: string;
  token: string;
};

async function readPayload(response: Response) {
  return (await response.json().catch(() => ({}))) as {
    message?: string;
    status?: string;
    teamSlug?: string;
  };
}

export function TeamInviteActions({ currentTeamName, token }: TeamInviteActionsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function acceptInvite(leaveCurrentTeam = false) {
    startTransition(async () => {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveCurrentTeam }),
      });
      const payload = await readPayload(response);

      setFeedback(
        payload.message ?? (response.ok ? "Invite accepted." : "Unable to accept invite."),
      );

      if (response.ok) {
        window.dispatchEvent(new Event("team-memberships-changed"));
        if (payload.teamSlug) {
          router.push(`/teams?team=${encodeURIComponent(payload.teamSlug)}`);
        } else {
          router.refresh();
        }
      }
    });
  }

  if (currentTeamName) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <p className="rounded-lg border border-line bg-white/5 p-4 text-sm leading-6 text-muted">
          You are currently on {currentTeamName}. Leave that team and accept this invite?
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => acceptInvite(true)}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Switching..." : "Leave and accept"}
          </button>
          <Link
            href="/teams"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
          >
            My team
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => acceptInvite(false)}
        disabled={isPending}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserCheck className="h-4 w-4" />
        {isPending ? "Accepting..." : "Accept invite"}
      </button>
      {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}
