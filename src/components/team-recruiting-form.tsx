"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus, UserPlus } from "lucide-react";
import { RECRUITING_ROLE_OPTIONS } from "@/lib/recruiting-roles";
import type { TeamProfile } from "@/lib/types";

const RECRUITING_ROLE_SET = new Set<string>(RECRUITING_ROLE_OPTIONS);

function uniqueRoles(roles: string[]) {
  return Array.from(new Set(roles));
}

function validRecruitingRoles(roles: string[]) {
  return uniqueRoles(roles.filter((role) => RECRUITING_ROLE_SET.has(role)));
}

function sameRoles(first: string[], second: string[]) {
  const firstRoles = uniqueRoles(first).sort();
  const secondRoles = uniqueRoles(second).sort();

  return firstRoles.length === secondRoles.length && firstRoles.every((role, index) => role === secondRoles[index]);
}

export function TeamRecruitingForm({ team }: { team: TeamProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedForm, setSavedForm] = useState({
    recruiting: team.recruiting,
    openRoles: validRecruitingRoles(team.openRoles),
    focus: team.focus,
    description: team.description,
  });
  const [form, setForm] = useState({
    recruiting: team.recruiting,
    openRoles: validRecruitingRoles(team.openRoles),
    focus: team.focus,
    description: team.description,
  });
  const isDirty =
    form.recruiting !== savedForm.recruiting ||
    form.focus !== savedForm.focus ||
    form.description !== savedForm.description ||
    !sameRoles(form.openRoles, savedForm.openRoles);
  const submitLabel = savedForm.recruiting ? "Update recruitment" : "Open recruitment";

  function saveRecruiting(nextForm: typeof form) {
    startTransition(async () => {
      const openRoles = nextForm.recruiting ? uniqueRoles(nextForm.openRoles) : [];
      const response = await fetch(`/api/teams/${team.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiting: nextForm.recruiting,
          openRoles,
          focus: nextForm.focus,
          description: nextForm.description,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setFeedback(payload?.message ?? (response.ok ? "Recruiting updated." : "Unable to save changes."));

      if (response.ok) {
        const saved = { ...nextForm, openRoles };

        setForm(saved);
        setSavedForm(saved);
        router.refresh();
      }
    });
  }

  function setRecruiting(recruiting: boolean) {
    const nextForm = { ...form, recruiting };

    setForm(nextForm);

    if (!recruiting && savedForm.recruiting) {
      saveRecruiting(nextForm);
    }
  }

  function toggleRole(role: string) {
    setForm((current) => ({
      ...current,
      openRoles: current.openRoles.includes(role)
        ? current.openRoles.filter((item) => item !== role)
        : [...current.openRoles, role],
    }));
  }

  return (
    <form
      className="surface rounded-lg p-6"
      onSubmit={(event) => {
        event.preventDefault();
        saveRecruiting(form);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-line bg-white/5 p-3 text-accent-strong">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Recruiting Needs</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Open recruitment for your team</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            When recruitment is open, players can find your team in Browse Teams and apply to join
            with one click.
          </p>
        </div>
      </div>

      <label className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-line bg-white/5 p-4 text-sm text-slate-100">
        <span>
          <span className="block font-medium text-white">Open team to applications</span>
          <span className="mt-1 block text-muted">Turn this off when the roster is closed.</span>
        </span>
        <span className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.recruiting}
            onChange={(event) => setRecruiting(event.target.checked)}
            disabled={isPending}
            className="h-5 w-5 accent-[var(--accent)]"
          />
          <ChevronDown
            className={`h-5 w-5 text-muted transition ${form.recruiting ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </label>

      {form.recruiting ? (
        <div className="mt-6 border-t border-line pt-6">
          <div>
            <p className="text-sm font-medium text-white">Open roles</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Choose the exact roles a serious applicant should see in Browse Teams.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {RECRUITING_ROLE_OPTIONS.map((role) => {
                const selected = form.openRoles.includes(role);

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    disabled={isPending}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition disabled:opacity-50 ${
                      selected
                        ? "border-accent bg-accent text-slate-950"
                        : "border-line bg-white/5 text-slate-100 hover:border-accent/50"
                    }`}
                  >
                    {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-6 grid gap-2 text-sm text-slate-200">
            Recruiting description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              disabled={isPending}
              required
              minLength={10}
              placeholder="Describe what you're looking for: characters, role fit, availability, comms, and team goals."
              className="min-h-28 rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {form.recruiting ? (
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            <Check className="h-4 w-4" />
            {isPending ? "Updating..." : submitLabel}
          </button>
        ) : null}
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}
