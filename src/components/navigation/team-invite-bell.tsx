"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, LoaderCircle, MessageSquare, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
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

type HeaderNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
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
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const openedByClickRef = useRef(false);

  useEffect(() => {
    let active = true;

    function loadInvites(showLoading = true) {
      if (showLoading) {
        setLoading(true);
      }

      Promise.all([
        fetch("/api/profile/invites", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : { invites: [] }))
          .catch(() => ({ invites: [] })),
        fetch("/api/profile/notifications", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : { notifications: [] }))
          .catch(() => ({ notifications: [] })),
      ])
        .then(([invitePayload, notificationPayload]: [
          { invites?: TeamInvite[] },
          { notifications?: HeaderNotification[] },
        ]) => {
          if (active) {
            setInvites(invitePayload.invites ?? []);
            setNotifications(notificationPayload.notifications ?? []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setInvites([]);
            setNotifications([]);
            setLoading(false);
          }
        });
    }

    loadInvites();
    const handleMembershipsChanged = () => loadInvites();
    const handleNotificationsChanged = () => loadInvites(false);
    const refreshInterval = window.setInterval(() => loadInvites(false), 30_000);
    window.addEventListener("team-memberships-changed", handleMembershipsChanged);
    window.addEventListener("scrim-notifications-changed", handleNotificationsChanged);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("team-memberships-changed", handleMembershipsChanged);
      window.removeEventListener("scrim-notifications-changed", handleNotificationsChanged);
    };
  }, [pathname]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocus = event.relatedTarget;

    if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
      closeMenu();
    }
  }

  function closeMenu() {
    setOpen(false);

    if (!openedByClickRef.current || notifications.length === 0) {
      openedByClickRef.current = false;
      return;
    }

    openedByClickRef.current = false;
    setNotifications([]);
    void fetch("/api/profile/notifications", { method: "PATCH" });
    window.dispatchEvent(new Event("scrim-notifications-changed"));
    router.refresh();
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

  function markNotificationRead(notificationId: string) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
    void fetch(`/api/profile/notifications/${notificationId}`, { method: "PATCH" });
    setOpen(false);
  }

  const inviteCount = invites.length;
  const notificationCount = notifications.length;
  const totalCount = inviteCount + notificationCount;

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        aria-label={totalCount > 0 ? `${totalCount} notification${totalCount === 1 ? "" : "s"}` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          openedByClickRef.current = true;

          if (open) {
            closeMenu();
            return;
          }

          setOpen(true);
        }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-white/4 text-slate-100 transition hover:bg-white/8 hover:text-white ${
          notificationCount > 0 ? "border-success/60 shadow-[0_0_22px_rgba(114,209,178,0.18)]" : "border-line"
        }`}
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 ? (
          <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none text-slate-950 ${
            notificationCount > 0 ? "bg-success" : "bg-accent"
          }`}>
            {totalCount}
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
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="mt-1 text-xs text-muted">
                {totalCount > 0 ? "Review team and scrim updates waiting for you." : "Nothing needs your attention right now."}
              </p>
            </div>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-muted" /> : null}
          </div>

          <div className="mt-3 space-y-3">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.href}
                role="menuitem"
                onClick={() => markNotificationRead(notification.id)}
                className="block rounded-lg border border-success/35 bg-success/10 p-3 transition hover:border-success/60 hover:bg-success/15"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success/15 text-success">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-300">
                      {notification.body}
                    </span>
                  </span>
                </div>
              </Link>
            ))}

            {invites.map((invite) => {
              const actionIsPending = isPending && activeInviteId === invite.id;

              return (
                <div key={invite.id} className="rounded-lg border border-line bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{invite.team.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span>{invite.team.tag}</span>
                        <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 font-medium text-slate-200">
                          Region {invite.team.region}
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

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleInviteAction(invite.id, "accept")}
                      disabled={!invite.canAccept || actionIsPending}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionIsPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Accept Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInviteAction(invite.id, "decline")}
                      disabled={actionIsPending}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-300/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline Invite
                    </button>
                    <Link
                      href={`/teams/${invite.team.slug}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/6 sm:col-span-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Roster
                    </Link>
                  </div>
                </div>
              );
            })}

            {!loading && totalCount === 0 ? (
              <div className="rounded-lg border border-line bg-white/5 p-3 text-sm text-muted">
                No unread notifications.
              </div>
            ) : null}
          </div>

          {feedback ? <p className="mt-3 text-xs text-muted">{feedback}</p> : null}
        </div>
      </div>
    </div>
  );
}
