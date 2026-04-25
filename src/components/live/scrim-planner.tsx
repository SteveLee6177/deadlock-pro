"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamSummary } from "@/lib/types";

type FormState = {
  teamId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  notes: string;
};

export function ScrimPlanner({
  teams,
  disabled,
}: {
  teams: TeamSummary[];
  disabled: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [scrimForm, setScrimForm] = useState({
    requesterTeamId: teams[0]?.id ?? "",
    startsAt: "",
    region: "NA East",
    format: "Bo3",
    wantedRank: "Oracle+",
    notes: "",
  });
  const [scheduleForm, setScheduleForm] = useState<FormState>({
    teamId: teams[0]?.id ?? "",
    title: "",
    startsAt: "",
    endsAt: "",
    location: "Discord",
    notes: "",
  });

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form
        className="surface rounded-[28px] p-6"
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            const response = await fetch("/api/scrims", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(scrimForm),
            });

            const payload = (await response.json()) as { message?: string };
            setFeedback(payload.message ?? (response.ok ? "Scrim posted." : "Unable to create scrim."));

            if (response.ok) {
              setScrimForm((current) => ({ ...current, notes: "", startsAt: "" }));
              router.refresh();
            }
          });
        }}
      >
        <div className="mb-5">
          <p className="eyebrow">Post A Scrim</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">Open a scrim request</h3>
        </div>

        <div className="grid gap-4">
          <select
            value={scrimForm.requesterTeamId}
            onChange={(event) =>
              setScrimForm((current) => ({ ...current, requesterTeamId: event.target.value }))
            }
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id} className="bg-slate-900">
                {team.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={scrimForm.startsAt}
            onChange={(event) =>
              setScrimForm((current) => ({ ...current, startsAt: event.target.value }))
            }
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={scrimForm.region}
              onChange={(event) =>
                setScrimForm((current) => ({ ...current, region: event.target.value }))
              }
              placeholder="Region"
              className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending}
            />
            <input
              value={scrimForm.format}
              onChange={(event) =>
                setScrimForm((current) => ({ ...current, format: event.target.value }))
              }
              placeholder="Format"
              className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending}
            />
            <input
              value={scrimForm.wantedRank}
              onChange={(event) =>
                setScrimForm((current) => ({ ...current, wantedRank: event.target.value }))
              }
              placeholder="Target rank"
              className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending}
            />
          </div>
          <textarea
            value={scrimForm.notes}
            onChange={(event) =>
              setScrimForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Preferred goals, feedback structure, or lobby notes."
            className="min-h-28 rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          />
        </div>

        <button
          type="submit"
          disabled={disabled || isPending}
          className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post scrim"}
        </button>
      </form>

      <form
        className="surface rounded-[28px] p-6"
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            const response = await fetch("/api/schedule", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(scheduleForm),
            });

            const payload = (await response.json()) as { message?: string };
            setFeedback(
              payload.message ?? (response.ok ? "Schedule event created." : "Unable to create event."),
            );

            if (response.ok) {
              setScheduleForm((current) => ({
                ...current,
                title: "",
                startsAt: "",
                endsAt: "",
                notes: "",
              }));
              router.refresh();
            }
          });
        }}
      >
        <div className="mb-5">
          <p className="eyebrow">Schedule Control</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">
            Add a live calendar event
          </h3>
        </div>

        <div className="grid gap-4">
          <select
            value={scheduleForm.teamId}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, teamId: event.target.value }))
            }
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id} className="bg-slate-900">
                {team.name}
              </option>
            ))}
          </select>
          <input
            value={scheduleForm.title}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Event title"
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="datetime-local"
              value={scheduleForm.startsAt}
              onChange={(event) =>
                setScheduleForm((current) => ({ ...current, startsAt: event.target.value }))
              }
              className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending}
            />
            <input
              type="datetime-local"
              value={scheduleForm.endsAt}
              onChange={(event) =>
                setScheduleForm((current) => ({ ...current, endsAt: event.target.value }))
              }
              className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending}
            />
          </div>
          <input
            value={scheduleForm.location}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, location: event.target.value }))
            }
            placeholder="Location"
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          />
          <textarea
            value={scheduleForm.notes}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Anything teammates need before the block starts?"
            className="min-h-28 rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="submit"
            disabled={disabled || isPending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Add to schedule"}
          </button>
          {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
        </div>
      </form>
    </div>
  );
}
