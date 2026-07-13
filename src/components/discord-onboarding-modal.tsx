"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
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

export function DiscordOnboardingModal() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [discordUsername, setDiscordUsername] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    setIsOpen(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("discord");
    const nextSearch = nextParams.toString();
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
  }

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
        closeModal();
        router.refresh();
      }
    });
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="discord-onboarding-title"
        className="w-full max-w-md rounded-lg border border-line bg-[#07131e] p-6 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/8 text-accent-strong">
              <DiscordIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">Discord</p>
              <h2
                id="discord-onboarding-title"
                className="mt-1 font-display text-2xl font-bold text-white"
              >
                Add your username
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close Discord prompt"
            title="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-300">
          Share your Discord so teammates can reach you for tryouts, scrims, and roster updates.
        </p>

        <label className="mt-6 grid gap-2 text-sm text-slate-200">
          Discord username
          <input
            autoFocus
            value={discordUsername}
            onChange={(event) => setDiscordUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveDiscordUsername();
              }
            }}
            placeholder="username"
            maxLength={64}
            className="h-11 rounded-lg border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
          />
        </label>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex h-10 items-center justify-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={saveDiscordUsername}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Discord"}
          </button>
        </div>

        {feedback ? <p className="mt-3 text-sm text-muted">{feedback}</p> : null}
      </section>
    </div>
  );
}
