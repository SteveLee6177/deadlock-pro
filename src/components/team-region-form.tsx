"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, MapPinned } from "lucide-react";
import { REGION_OPTIONS } from "@/lib/regions";

export function TeamRegionForm({
  currentRegion,
  slug,
}: {
  currentRegion: string;
  slug: string;
}) {
  const router = useRouter();
  const [region, setRegion] = useState(currentRegion);
  const [savedRegion, setSavedRegion] = useState(currentRegion);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDirty = region !== savedRegion;

  function saveRegion() {
    startTransition(async () => {
      const response = await fetch(`/api/teams/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      setFeedback(payload?.message ?? (response.ok ? "Team region saved." : "Unable to save region."));

      if (response.ok) {
        setSavedRegion(region);
        router.refresh();
      }
    });
  }

  return (
    <form
      className="rounded-lg border border-line bg-white/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveRegion();
      }}
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg border border-line bg-white/5 p-2 text-accent-strong">
          <MapPinned className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Team region</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Captains can move the roster to the region used for discovery and scrim scheduling.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Region
          <span className="relative">
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              disabled={isPending}
              className="h-11 w-full appearance-none rounded-lg border border-line bg-slate-950/80 px-3 pr-10 text-sm text-white outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {REGION_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-slate-950">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
        >
          <Check className="h-4 w-4" />
          {isPending ? "Saving..." : "Save region"}
        </button>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
        </div>
      </div>
    </form>
  );
}
