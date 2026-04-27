"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserTeamOption } from "@/lib/types";

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
  teams: UserTeamOption[];
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
    wantedRank: "Eternus 5+",
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
        className="surface rounded-lg p-6"
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
          {teams.length === 0 ? (
            <p className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-muted">
              Create or join a team first to post a scrim request.
            </p>
          ) : null}
          <select
            value={scrimForm.requesterTeamId}
            onChange={(event) =>
              setScrimForm((current) => ({ ...current, requesterTeamId: event.target.value }))
            }
            className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id} className="bg-slate-900">
                {team.name} ({team.tag})
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={scrimForm.startsAt}
            onChange={(event) =>
              setScrimForm((current) => ({ ...current, startsAt: event.target.value }))
            }
            className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={scrimForm.region}
              onChange={(event) =>
                setScrimForm((current) => ({ ...current, region: event.target.value }))
              }
              placeholder="Region"
              className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending || teams.length === 0}
            />
            <input
              value={scrimForm.format}
              onChange={(event) =>
                setScrimForm((current) => ({ ...current, format: event.target.value }))
              }
              placeholder="Format"
              className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending || teams.length === 0}
            />
            <input
              value={scrimForm.wantedRank}
              onChange={(event) =>
                setScrimForm((current) => ({ ...current, wantedRank: event.target.value }))
              }
              placeholder="Target rank"
              className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending || teams.length === 0}
            />
          </div>
          <textarea
            value={scrimForm.notes}
            onChange={(event) =>
              setScrimForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Target practice goals, feedback structure, and lobby notes."
            className="min-h-28 rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          />
        </div>

        <button
          type="submit"
          disabled={disabled || isPending || teams.length === 0}
          className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post scrim"}
        </button>
      </form>

      <form
        className="surface rounded-lg p-6"
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
          {teams.length === 0 ? (
            <p className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-muted">
              Scheduling is limited to teams you are a member of.
            </p>
          ) : null}
          <select
            value={scheduleForm.teamId}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, teamId: event.target.value }))
            }
            className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id} className="bg-slate-900">
                {team.name} ({team.tag})
              </option>
            ))}
          </select>
          <input
            value={scheduleForm.title}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Event title"
            className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="datetime-local"
              value={scheduleForm.startsAt}
              onChange={(event) =>
                setScheduleForm((current) => ({ ...current, startsAt: event.target.value }))
              }
              className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending || teams.length === 0}
            />
            <input
              type="datetime-local"
              value={scheduleForm.endsAt}
              onChange={(event) =>
                setScheduleForm((current) => ({ ...current, endsAt: event.target.value }))
              }
              className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              disabled={disabled || isPending || teams.length === 0}
            />
          </div>
          <input
            value={scheduleForm.location}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, location: event.target.value }))
            }
            placeholder="Location"
            className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          />
          <textarea
            value={scheduleForm.notes}
            onChange={(event) =>
              setScheduleForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Anything teammates need before the block starts?"
            className="min-h-28 rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending || teams.length === 0}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            type="submit"
          disabled={disabled || isPending || teams.length === 0}
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
