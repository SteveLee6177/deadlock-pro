"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, X } from "lucide-react";

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  return payload?.message ?? fallback;
}

export function PlayerApplicationActions({
  applicationId,
  disabled = false,
}: {
  applicationId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInviteAction(action: "accept" | "decline") {
    startTransition(async () => {
      const response = await fetch(`/api/profile/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      setFeedback(
        await readMessage(
          response,
          response.ok
            ? action === "accept"
              ? "Invite accepted."
              : "Invite declined."
            : "Unable to update invite.",
        ),
      );

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => handleInviteAction("accept")}
        disabled={disabled || isPending}
        className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserCheck className="h-4 w-4" />
        {isPending ? "Accepting..." : "Accept invite"}
      </button>
      <button
        type="button"
        onClick={() => handleInviteAction("decline")}
        disabled={isPending}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X className="h-4 w-4" />
        Decline
      </button>
      {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}
