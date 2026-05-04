"use client";

import { UserMinus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as { message?: string };

  return payload.message ?? fallback;
}

export function TeamMemberKickButton({
  memberName,
  slug,
  userId,
}: {
  memberName: string;
  slug: string;
  userId: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function kickMember() {
    startTransition(async () => {
      const response = await fetch(`/api/teams/${slug}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-member" }),
      });

      if (response.ok) {
        window.dispatchEvent(new Event("team-memberships-changed"));
        setIsOpen(false);
        router.refresh();
        return;
      }

      setFeedback(await readMessage(response, "Unable to kick team member."));
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setIsOpen(true);
        }}
        aria-label={`Kick ${memberName} from team`}
        title="Kick from team"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/40 text-rose-100 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserMinus className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Kick Member</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Remove {memberName}?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white disabled:opacity-50"
                aria-label="Close kick confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              This removes them from the roster immediately. They will need to apply or be invited again to rejoin.
            </p>

            {feedback ? <p className="mt-4 text-sm text-rose-100">{feedback}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={kickMember}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-rose-200 disabled:opacity-50"
              >
                <UserMinus className="h-4 w-4" />
                {isPending ? "Kicking..." : "Kick member"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
