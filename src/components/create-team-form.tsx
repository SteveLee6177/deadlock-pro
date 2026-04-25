"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CreateTeamForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    tag: "",
    region: "NA East",
    rank: "Oracle",
    focus: "",
    openRoles: "",
    description: "",
  });

  return (
    <form
      className="surface rounded-[28px] p-6"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const response = await fetch("/api/teams", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
          });

          const payload = (await response.json()) as { message?: string };
          setFeedback(payload.message ?? (response.ok ? "Team created." : "Unable to create team."));

          if (response.ok) {
            setForm({
              name: "",
              tag: "",
              region: "NA East",
              rank: "Oracle",
              focus: "",
              openRoles: "",
              description: "",
            });
            router.refresh();
          }
        });
      }}
    >
      <div className="mb-5">
        <p className="eyebrow">Start A Team</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">Create a roster hub</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Team name"
          className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
        />
        <input
          value={form.tag}
          onChange={(event) => setForm((current) => ({ ...current, tag: event.target.value }))}
          placeholder="Tag (e.g. CSH)"
          className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
        />
        <input
          value={form.region}
          onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
          placeholder="Region"
          className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
        />
        <input
          value={form.rank}
          onChange={(event) => setForm((current) => ({ ...current, rank: event.target.value }))}
          placeholder="Primary rank"
          className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
        />
      </div>

      <input
        value={form.focus}
        onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))}
        placeholder="What kind of team is this?"
        className="mt-4 w-full rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        disabled={disabled || isPending}
      />

      <input
        value={form.openRoles}
        onChange={(event) => setForm((current) => ({ ...current, openRoles: event.target.value }))}
        placeholder="Open roles, comma separated"
        className="mt-4 w-full rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        disabled={disabled || isPending}
      />

      <textarea
        value={form.description}
        onChange={(event) =>
          setForm((current) => ({ ...current, description: event.target.value }))
        }
        placeholder="Describe culture, schedule expectations, and goals."
        className="mt-4 min-h-28 w-full rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        disabled={disabled || isPending}
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create team"}
        </button>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}
