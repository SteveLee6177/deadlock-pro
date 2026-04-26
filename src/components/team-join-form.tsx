"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TeamJoinForm({
  slug,
  disabled,
}: {
  slug: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      id="apply"
      className="surface rounded-[28px] p-6"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const response = await fetch(`/api/teams/${slug}/apply`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          });

          const payload = (await response.json()) as { message?: string };
          setFeedback(payload.message ?? (response.ok ? "Application sent." : "Unable to apply."));

          if (response.ok) {
            setMessage("");
            router.refresh();
          }
        });
      }}
    >
      <div className="mb-4">
        <p className="eyebrow">Join This Team</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">
          Send a quick introduction
        </h3>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Role, availability, rank, and what kind of team environment you want."
        className="min-h-32 w-full rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
        disabled={disabled || isPending}
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Apply to team"}
        </button>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}
