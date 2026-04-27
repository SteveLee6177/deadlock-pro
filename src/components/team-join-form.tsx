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
      className="surface rounded-lg p-6"
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
          setFeedback(
            payload.message ?? (response.ok ? "Trial request sent." : "Unable to request trial."),
          );

          if (response.ok) {
            setMessage("");
            router.refresh();
          }
        });
      }}
    >
      <div className="mb-4">
        <p className="eyebrow">Request Trial</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">
          Submit your performance case
        </h3>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Role, rank, server region, weekly availability, scrim history, notable results, and why you should get a trial block."
        className="min-h-32 w-full rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
        disabled={disabled || isPending}
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Request tryout"}
        </button>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}
