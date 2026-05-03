"use client";

import { Crown, LogOut, Trash2, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type TeamMemberOption = {
  id: string;
  profileName: string;
  role: string;
};

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { message?: string };

  return payload.message ?? fallback;
}

export function TeamLeaveButton({
  slug,
  teamName,
  role,
  members = [],
  currentUserId,
  iconOnly = false,
}: {
  slug: string;
  teamName?: string;
  role?: string;
  members?: TeamMemberOption[];
  currentUserId?: string | null;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const isOwner = role === "OWNER";
  const transferOptions = useMemo(
    () => members.filter((member) => member.id !== currentUserId),
    [currentUserId, members],
  );
  const [selectedOwnerId, setSelectedOwnerId] = useState(transferOptions[0]?.id ?? "");
  const [dialog, setDialog] = useState<"leave" | "transfer" | "disband" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function leaveTeam(transferToUserId?: string) {
    startTransition(async () => {
      const response = await fetch(`/api/teams/${slug}/membership`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferToUserId ? { transferToUserId } : {}),
      });

      if (response.ok) {
        router.push("/teams");
        router.refresh();
        return;
      }

      setFeedback(await readMessage(response, "Unable to leave team."));
    });
  }

  function disbandTeam() {
    startTransition(async () => {
      const response = await fetch(`/api/teams/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/teams");
        router.refresh();
        return;
      }

      setFeedback(await readMessage(response, "Unable to disband team."));
    });
  }

  if (!isOwner) {
    return (
      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setFeedback(null);
            setDialog("leave");
          }}
          aria-label={iconOnly ? "Leave team" : undefined}
          className={
            iconOnly
              ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/40 text-rose-100 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-50"
              : "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          <LogOut className="h-4 w-4" />
          {iconOnly ? null : isPending ? "Leaving..." : "Leave team"}
        </button>
        {feedback ? <p className="mt-3 text-sm text-muted">{feedback}</p> : null}

        {dialog === "leave" ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
            <div className="w-full max-w-lg rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Leave Team</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-white">
                    Leave {teamName ?? "this team"}?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  disabled={isPending}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white disabled:opacity-50"
                  aria-label="Close leave confirmation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted">
                This removes you from the roster. You will need to apply or be invited again to rejoin.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => leaveTeam()}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-rose-200 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isPending ? "Leaving..." : "Leave team"}
                </button>
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  disabled={isPending}
                  className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending || transferOptions.length === 0}
          onClick={() => {
            setFeedback(null);
            setSelectedOwnerId((current) => current || transferOptions[0]?.id || "");
            setDialog("transfer");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          Leave team
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setFeedback(null);
            setDialog("disband");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-300/40 bg-rose-300/10 px-4 text-sm font-medium text-rose-100 transition hover:bg-rose-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Disband team
        </button>
      </div>
      {transferOptions.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Add another member before leaving, or disband the team.
        </p>
      ) : null}
      {feedback ? <p className="mt-3 text-sm text-muted">{feedback}</p> : null}

      {dialog === "transfer" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Transfer Ownership</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">Choose the next owner</h2>
              </div>
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white disabled:opacity-50"
                aria-label="Close ownership transfer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              Leaving as owner requires handing the team to someone else first.
            </p>
            <label className="mt-5 grid gap-2 text-sm text-slate-200">
              New owner
              <select
                value={selectedOwnerId}
                onChange={(event) => setSelectedOwnerId(event.target.value)}
                disabled={isPending}
                className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
              >
                {transferOptions.map((member) => (
                  <option key={member.id} value={member.id} className="bg-slate-950">
                    {member.profileName} ({member.role})
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending || !selectedOwnerId}
                onClick={() => leaveTeam(selectedOwnerId)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-50"
              >
                <Crown className="h-4 w-4" />
                {isPending ? "Transferring..." : "Transfer and leave"}
              </button>
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={isPending}
                className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialog === "disband" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Disband Team</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Delete {teamName ?? "this team"}?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white disabled:opacity-50"
                aria-label="Close disband confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              This removes the team, roster, applications, schedule, and scrim records tied to it.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={disbandTeam}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-rose-200 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isPending ? "Disbanding..." : "Disband team"}
              </button>
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={isPending}
                className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
