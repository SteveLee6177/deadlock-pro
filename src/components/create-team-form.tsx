"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Plus, ShieldCheck, UserPlus, X } from "lucide-react";
import { RECRUITING_ROLE_OPTIONS } from "@/lib/recruiting-roles";
import { REGION_OPTIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

function getPlaceholderInviteLink(slug: string) {
  return `https://scrimlock.gg/invite/${slug}-24h`;
}

function uniqueRoles(roles: string[]) {
  return Array.from(new Set(roles));
}

export function CreateTeamForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [createdTeamSlug, setCreatedTeamSlug] = useState<string | null>(null);
  const [discordLink, setDiscordLink] = useState("");
  const [form, setForm] = useState({
    name: "",
    region: "NA",
    rank: "Eternus 6",
    recruiting: false,
    openRoles: [] as string[],
    description: "",
  });
  const inviteLink = createdTeamSlug ? getPlaceholderInviteLink(createdTeamSlug) : "";

  function openCreatedTeam() {
    if (createdTeamSlug) {
      router.push(`/teams?team=${createdTeamSlug}`);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <form
        className="surface rounded-lg p-6"
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            try {
              const response = await fetch("/api/teams", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
              });

              const body = await response.text();
              let payload: { message?: string; team?: { slug?: string } } = {};

              if (body) {
                try {
                  payload = JSON.parse(body) as { message?: string; team?: { slug?: string } };
                } catch {
                  payload = {};
                }
              }

              setFeedback(
                payload.message ?? (response.ok ? "Team created." : "Unable to create team."),
              );

              if (response.ok) {
                setForm({
                  name: "",
                  region: "NA",
                  rank: "Eternus 6",
                  recruiting: false,
                  openRoles: [],
                  description: "",
                });
                setDiscordLink("");
                setCopiedInvite(false);

                if (payload.team?.slug) {
                  setCreatedTeamSlug(payload.team.slug);
                } else {
                  router.refresh();
                }
              }
            } catch {
              setFeedback("Unable to create team. Please try again.");
            }
          });
        }}
      >
      <div className="mb-5">
        <p className="eyebrow">Create Team</p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">Start a team profile</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Team name"
          className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
          required
          minLength={2}
        />
        <select
          value={form.region}
          onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
          className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
          required
          aria-label="Region"
        >
          {REGION_OPTIONS.map((region) => (
            <option key={region} value={region} className="bg-slate-950">
              {region}
            </option>
          ))}
        </select>
        <input
          value={form.rank}
          onChange={(event) => setForm((current) => ({ ...current, rank: event.target.value }))}
          placeholder="Primary rank"
          className="rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
          disabled={disabled || isPending}
          required
          minLength={2}
        />
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-medium text-slate-200">Roster status</p>
        <div className="inline-flex w-full rounded-full border border-line bg-white/5 p-1 sm:w-auto">
          {[
            {
              label: "Established roster",
              recruiting: false,
              icon: ShieldCheck,
            },
            {
              label: "Recruiting players",
              recruiting: true,
              icon: UserPlus,
            },
          ].map((item) => {
            const Icon = item.icon;
            const selected = form.recruiting === item.recruiting;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    recruiting: item.recruiting,
                    openRoles: item.recruiting ? current.openRoles : [],
                  }))
                }
                disabled={disabled || isPending}
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition sm:flex-none",
                  selected
                    ? "bg-accent text-slate-950"
                    : "text-slate-100 hover:bg-white/6 disabled:hover:bg-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {form.recruiting ? (
        <>
          <div className="mt-4">
            <p className="mb-3 text-sm font-medium text-slate-200">Open roles</p>
            <div className="flex flex-wrap gap-2">
              {RECRUITING_ROLE_OPTIONS.map((role) => {
                const selected = form.openRoles.includes(role);

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        openRoles: selected
                          ? current.openRoles.filter((item) => item !== role)
                          : uniqueRoles([...current.openRoles, role]),
                      }))
                    }
                    disabled={disabled || isPending}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition disabled:opacity-50",
                      selected
                        ? "border-accent bg-accent text-slate-950"
                        : "border-line bg-white/5 text-slate-100 hover:border-accent/50",
                    )}
                  >
                    {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Describe what you're looking for: characters, role fit, availability, comms, and team goals."
            className="mt-4 min-h-28 w-full rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            disabled={disabled || isPending}
          />
        </>
      ) : null}

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

      {createdTeamSlug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Team Created</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">
                  Invite your teammates
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Copy and paste this in Discord. Link lasts for 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreatedTeam}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white"
                aria-label="Close invite modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={inviteLink}
                  readOnly
                  className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-slate-950/60 px-3 text-sm text-slate-200 outline-none"
                  aria-label="Team invite link"
                />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteLink);
                    setCopiedInvite(true);
                    window.setTimeout(() => setCopiedInvite(false), 1800);
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                >
                  {copiedInvite ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedInvite ? "Copied" : "Copy link"}
                </button>
              </div>

              <input
                value={discordLink}
                onChange={(event) => setDiscordLink(event.target.value)}
                placeholder="Optional: Discord server or team channel link"
                className="h-11 rounded-lg border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openCreatedTeam}
                className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
              >
                Open team dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedTeamSlug(null);
                  router.refresh();
                }}
                className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
