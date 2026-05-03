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
          });

          const payload = (await response.json()) as { message?: string };
          setFeedback(
            payload.message ?? (response.ok ? "Application sent." : "Unable to apply."),
          );

          if (response.ok) {
            router.refresh();
          }
        });
      }}
    >
      <div className="mb-4">
        <p className="eyebrow">Apply to Join</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">
          Send your application
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          One click sends your profile to the team owner and managers. They will decide the next
          step from their My Team page.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Applying..." : "Apply to Join"}
        </button>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}
