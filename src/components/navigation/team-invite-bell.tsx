"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, LoaderCircle, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { FocusEvent } from "react";
import { RankBadge } from "@/components/rank-badge";

type TeamInvite = {
  id: string;
  createdAt: string;
  canAccept: boolean;
  team: {
    id: string;
    slug: string;
    name: string;
    tag: string;
    region: string;
    primaryRank: string;
    primaryRankBadgeLevel: number | null;
  };
};

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  return payload?.message ?? fallback;
}

export function TeamInviteBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    function loadInvites() {
      setLoading(true);

      fetch("/api/profile/invites", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { invites: [] }))
        .then((payload: { invites?: TeamInvite[] }) => {
          if (active) {
            setInvites(payload.invites ?? []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setInvites([]);
            setLoading(false);
          }
        });
    }

    loadInvites();
    window.addEventListener("team-memberships-changed", loadInvites);

    return () => {
      active = false;
      window.removeEventListener("team-memberships-changed", loadInvites);
    };
  }, [pathname]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocus = event.relatedTarget;

    if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
      setOpen(false);
    }
  }

  function handleInviteAction(inviteId: string, action: "accept" | "decline") {
    setActiveInviteId(inviteId);
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch(`/api/profile/applications/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const message = await readMessage(
        response,
        response.ok
          ? action === "accept"
            ? "Invite accepted."
            : "Invite declined."
          : "Unable to update invite.",
      );

      setFeedback(message);
      setActiveInviteId(null);

      if (response.ok) {
        setInvites((current) => current.filter((invite) => invite.id !== inviteId));
        window.dispatchEvent(new Event("team-memberships-changed"));
        router.refresh();
      }
    });
  }

  const inviteCount = invites.length;

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={inviteCount > 0 ? `${inviteCount} team invite${inviteCount === 1 ? "" : "s"}` : "Team invites"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/4 text-slate-100 transition hover:bg-white/8 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {inviteCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-slate-950">
            {inviteCount}
          </span>
        ) : null}
      </button>

      <div
        className={`absolute right-0 top-full z-50 w-[min(22rem,calc(100vw-2rem))] pt-3 transition ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div
          role="menu"
          className="rounded-lg border border-line bg-[#07131e] p-3 shadow-2xl shadow-black/35"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
            <div>
              <p className="text-sm font-semibold text-white">Team invites</p>
              <p className="mt-1 text-xs text-muted">
                {inviteCount > 0 ? "Review roster offers waiting for you." : "No active invites right now."}
              </p>
            </div>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-muted" /> : null}
          </div>

          <div className="mt-3 space-y-3">
            {invites.map((invite) => {
              const actionIsPending = isPending && activeInviteId === invite.id;

              return (
                <div key={invite.id} className="rounded-lg border border-line bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{invite.team.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span>
                          {invite.team.tag} · {invite.team.region}
                        </span>
                        <RankBadge
                          badgeLevel={invite.team.primaryRankBadgeLevel}
                          rank={invite.team.primaryRank}
                          size="sm"
                        />
                      </div>
                    </div>
                    <span className="rounded-full border border-success/30 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                      Invited
                    </span>
                  </div>

                  {!invite.canAccept ? (
                    <p className="mt-3 text-xs leading-5 text-muted">
                      Leave your current team before accepting another invite.
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInviteAction(invite.id, "accept")}
                      disabled={!invite.canAccept || actionIsPending}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionIsPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInviteAction(invite.id, "decline")}
                      disabled={actionIsPending}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </button>
                    <Link
                      href={`/teams/${invite.team.slug}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/6"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View team
                    </Link>
                  </div>
                </div>
              );
            })}

            {!loading && inviteCount === 0 ? (
              <div className="rounded-lg border border-line bg-white/5 p-3 text-sm text-muted">
                No pending team invites.
              </div>
            ) : null}
          </div>

          {feedback ? <p className="mt-3 text-xs text-muted">{feedback}</p> : null}
        </div>
      </div>
    </div>
  );
}
