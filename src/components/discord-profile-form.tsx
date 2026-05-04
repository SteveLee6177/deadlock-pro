"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DiscordIcon } from "@/components/icons/discord-icon";

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as {
    discordUsername?: string | null;
    message?: string;
  } | null;

  return {
    discordUsername: payload?.discordUsername ?? null,
    message: payload?.message ?? fallback,
  };
}

export function DiscordProfileForm({
  initialUsername,
  onSaved,
}: {
  initialUsername: string | null;
  onSaved?: (username: string | null) => void;
}) {
  const router = useRouter();
  const [discordUsername, setDiscordUsername] = useState(initialUsername ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveDiscordUsername() {
    startTransition(async () => {
      const response = await fetch("/api/profile/discord", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordUsername }),
      });
      const result = await readMessage(
        response,
        response.ok ? "Discord saved." : "Unable to save Discord.",
      );

      setFeedback(result.message);

      if (response.ok) {
        setDiscordUsername(result.discordUsername ?? "");
        onSaved?.(result.discordUsername);
        router.refresh();
      }
    });
  }

  return (
    <section className="surface rounded-lg p-6">
      <div className="flex items-center gap-3">
        <DiscordIcon className="h-5 w-5 text-accent-strong" />
        <div>
          <p className="eyebrow">Discord</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Quick contact</h2>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="grid flex-1 gap-2 text-sm text-slate-200">
          Discord username
          <input
            value={discordUsername}
            onChange={(event) => setDiscordUsername(event.target.value)}
            placeholder="username"
            maxLength={64}
            className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={saveDiscordUsername}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
      {feedback ? <p className="mt-3 text-sm text-muted">{feedback}</p> : null}
    </section>
  );
}
