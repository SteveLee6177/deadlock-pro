"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Pencil, Send, Trash2, X } from "lucide-react";
import { REGION_OPTIONS } from "@/lib/regions";
import { toLocalInputValue, toUtcIsoFromLocalInput } from "@/lib/time-zone";
import type { ScrimAvailabilitySummary, ScrimMatchSummary, ScrimTeamOption } from "@/lib/types";

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return payload?.message ?? fallback;
}

export function ScrimAvailabilityForm({
  teams,
  compact = false,
}: {
  teams: ScrimTeamOption[];
  compact?: boolean;
}) {
  const router = useRouter();
  const manageableTeams = teams.filter((team) => team.canManageScrims);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    teamId: manageableTeams[0]?.id ?? "",
    startTime: "",
    endTime: "",
    region: manageableTeams[0]?.region ?? "NA",
    notes: "",
  });

  return (
    <form
      className={compact ? "grid gap-3" : "surface rounded-lg p-6"}
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const response = await fetch("/api/scrims/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              startTime: toUtcIsoFromLocalInput(form.startTime),
              endTime: toUtcIsoFromLocalInput(form.endTime),
            }),
          });

          setFeedback(await readMessage(response, "Availability block saved."));

          if (response.ok) {
            setForm((current) => ({
              ...current,
              startTime: "",
              endTime: "",
              notes: "",
            }));
            router.refresh();
          }
        });
      }}
    >
      <div>
        <p className="eyebrow">Create Availability</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-white">Open a scrim block</h2>
      </div>

      {manageableTeams.length === 0 ? (
        <p className="rounded-[18px] border border-line bg-white/5 p-4 text-sm text-muted">
          Only team owners and managers can create official availability.
        </p>
      ) : null}

      <div className="grid gap-3">
        <select
          value={form.teamId}
          onChange={(event) => {
            const team = manageableTeams.find((item) => item.id === event.target.value);
            setForm((current) => ({
              ...current,
              teamId: event.target.value,
              region: team?.region ?? current.region,
            }));
          }}
          disabled={isPending || manageableTeams.length === 0}
          className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
        >
          {manageableTeams.map((team) => (
            <option key={team.id} value={team.id} className="bg-slate-950">
              {team.name}
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
            disabled={isPending || manageableTeams.length === 0}
            className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
          />
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
            disabled={isPending || manageableTeams.length === 0}
            className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
          />
        </div>
        <select
          value={form.region}
          onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
          disabled={isPending || manageableTeams.length === 0}
          aria-label="Region"
          className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
        >
          {REGION_OPTIONS.map((region) => (
            <option key={region} value={region} className="bg-slate-950">
              {region}
            </option>
          ))}
        </select>
        <textarea
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          disabled={isPending || manageableTeams.length === 0}
          placeholder="Notes, preferred format, or lobby expectations"
          className="min-h-24 rounded-[14px] border border-line bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || manageableTeams.length === 0}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4" />
          {isPending ? "Saving..." : "Create block"}
        </button>
        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}

export function RequestScrimButton({
  block,
  teams,
}: {
  block: ScrimAvailabilitySummary;
  teams: ScrimTeamOption[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const eligibleTeams = useMemo(
    () => teams.filter((team) => team.canManageScrims && team.id !== block.teamId),
    [block.teamId, teams],
  );
  const [requestingTeamId, setRequestingTeamId] = useState(eligibleTeams[0]?.id ?? "");

  function requestScrim() {
    if (!requestingTeamId) {
      setFeedback("Choose a team that can request this scrim.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/scrims/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityBlockId: block.id,
          requestingTeamId,
        }),
      });

      setFeedback(await readMessage(response, "Scrim request submitted."));

      if (response.ok) {
        router.refresh();
      }
    });
  }

  if (teams.length === 0) {
    return (
      <Link
        href="/teams"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
      >
        <Send className="h-4 w-4" />
        Join or create team
      </Link>
    );
  }

  if (eligibleTeams.length === 0) {
    return (
      <button
        type="button"
        onClick={() => setFeedback("Only team owners/managers can request official scrims.")}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
      >
        <Send className="h-4 w-4" />
        Request Scrim
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={requestScrim}
        disabled={isPending || !requestingTeamId}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
      >
        <Send className="h-4 w-4" />
        {isPending ? "Requesting..." : "Request Scrim"}
      </button>
      {eligibleTeams.length > 1 ? (
        <select
          value={requestingTeamId}
          onChange={(event) => setRequestingTeamId(event.target.value)}
          disabled={isPending}
          aria-label="Requesting team"
          className="h-10 rounded-full border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
        >
          {eligibleTeams.map((team) => (
            <option key={team.id} value={team.id} className="bg-slate-950">
              {team.name}
            </option>
          ))}
        </select>
      ) : null}
      {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
    </>
  );
}

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function act(action: "accept" | "decline") {
    startTransition(async () => {
      const response = await fetch(`/api/scrims/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      setFeedback(await readMessage(response, "Request updated."));

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => act("accept")}
        disabled={isPending}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-success px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        Accept
      </button>
      <button
        type="button"
        onClick={() => act("decline")}
        disabled={isPending}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
        Decline
      </button>
      {feedback ? <p className="basis-full text-sm text-muted">{feedback}</p> : null}
    </>
  );
}

export function AvailabilityBlockManager({
  block,
}: {
  block: ScrimAvailabilitySummary;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    startTime: toLocalInputValue(block.startTime),
    endTime: toLocalInputValue(block.endTime),
    region: block.region,
    notes: block.notes ?? "",
  });

  function cancelBlock() {
    if (!window.confirm("Cancel this availability block?")) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/scrims/availability/${block.id}`, {
        method: "DELETE",
      });

      setFeedback(await readMessage(response, "Availability block cancelled."));

      if (response.ok) {
        router.refresh();
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={isPending || block.status === "BOOKED" || block.status === "CANCELLED"}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={cancelBlock}
          disabled={isPending || block.status === "BOOKED" || block.status === "CANCELLED"}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-300/30 px-3 text-sm font-medium text-rose-100 transition hover:bg-rose-300/10 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Cancel
        </button>
        {feedback ? <p className="basis-full text-sm text-muted">{feedback}</p> : null}
      </div>
    );
  }

  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const response = await fetch(`/api/scrims/availability/${block.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              startTime: toUtcIsoFromLocalInput(form.startTime),
              endTime: toUtcIsoFromLocalInput(form.endTime),
            }),
          });

          setFeedback(await readMessage(response, "Availability block updated."));

          if (response.ok) {
            setEditing(false);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="datetime-local"
          value={form.startTime}
          onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
          className="h-10 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
        />
        <input
          type="datetime-local"
          value={form.endTime}
          onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
          className="h-10 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
        />
      </div>
      <select
        value={form.region}
        onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
        aria-label="Region"
        className="h-10 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
      >
        {REGION_OPTIONS.map((region) => (
          <option key={region} value={region} className="bg-slate-950">
            {region}
          </option>
        ))}
      </select>
      <textarea
        value={form.notes}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        className="min-h-20 rounded-[14px] border border-line bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-accent"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium text-slate-100 transition hover:bg-white/6"
        >
          <X className="h-4 w-4" />
          Close
        </button>
        {feedback ? <p className="basis-full text-sm text-muted">{feedback}</p> : null}
      </div>
    </form>
  );
}

export function ScrimMatchManager({ scrim }: { scrim: ScrimMatchSummary }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cancelScrim() {
    if (!window.confirm("Cancel this confirmed scrim for both teams?")) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/scrims/matches/${scrim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      setFeedback(await readMessage(response, "Scrim cancelled."));

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={cancelScrim}
        disabled={isPending || scrim.status === "CANCELLED" || scrim.status === "COMPLETED"}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-300/30 px-3 text-sm font-medium text-rose-100 transition hover:bg-rose-300/10 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        Cancel scrim
      </button>
      {feedback ? <p className="basis-full text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}
