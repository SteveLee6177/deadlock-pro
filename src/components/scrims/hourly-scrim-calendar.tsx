"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, startOfWeek } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Send, X } from "lucide-react";
import { ScrimStatusPill } from "@/components/scrims/scrim-status-pill";
import { cn } from "@/lib/utils";
import {
  formatScheduleRangeInTimeZone,
  getBrowserTimeZone,
  getTimeZoneName,
} from "@/lib/time-zone";
import type {
  ScrimCalendarEvent,
  ScrimRequestSummary,
  ScrimTeamOption,
} from "@/lib/types";

const HOUR_ROW_HEIGHT = 76;
const VISIBLE_HOUR_ROWS = 5;
const DEFAULT_SCROLL_HOUR = 19;

const EVENT_STYLES: Record<ScrimCalendarEvent["kind"], string> = {
  availability: "border-success/30 bg-success/10",
  request: "border-accent-strong/30 bg-accent-strong/10",
  scrim: "border-sky-300/30 bg-sky-300/10",
};

type SelectedSlot = {
  startTime: string;
  endTime: string;
};

type DayScrollState = {
  canScrollDown: boolean;
  canScrollUp: boolean;
};

function makeLocalSlot(day: Date, hour: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
}

function formatLocalHour(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    hour12: true,
    timeZone,
  })
    .format(date)
    .replace(" ", "")
    .toLowerCase();
}

function formatLocalDay(day: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone,
    weekday: "short",
  }).format(day);
}

function formatLocalMonthDay(day: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(day);
}

function overlapsHour(startIso: string, endIso: string, slotStart: Date, slotEnd: Date) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  return start < slotEnd && end > slotStart;
}

function blocksNewAvailability(event: ScrimCalendarEvent) {
  return (
    (event.kind === "availability" || event.kind === "scrim") &&
    event.status !== "CANCELLED"
  );
}

function eventStyle(event: ScrimCalendarEvent) {
  if (event.status === "CANCELLED") {
    return "border-rose-300/30 bg-rose-300/10";
  }

  if (event.status === "BOOKED" || event.status === "CONFIRMED" || event.status === "ACCEPTED") {
    return "border-sky-300/30 bg-sky-300/10";
  }

  return EVENT_STYLES[event.kind];
}

function eventTitle(event: ScrimCalendarEvent) {
  return event.kind === "availability" ? "Looking For Scrim" : event.title;
}

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return payload?.message ?? fallback;
}

export function HourlyScrimCalendar({
  events,
  requests,
  teams,
  selectedTeam,
}: {
  events: ScrimCalendarEvent[];
  requests: ScrimRequestSummary[];
  teams: ScrimTeamOption[];
  selectedTeam: ScrimTeamOption;
}) {
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [pendingCancel, setPendingCancel] = useState<ScrimCalendarEvent | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [dayScrollState, setDayScrollState] = useState<Record<string, DayScrollState>>({});
  const [isActionPending, startActionTransition] = useTransition();
  const dayScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const router = useRouter();
  const hours = useMemo(() => Array.from({ length: 24 }, (_, hour) => hour), []);
  const days = useMemo(
    () => (weekStart ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : []),
    [weekStart],
  );
  const canManage = selectedTeam.canManageScrims;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const now = new Date();

      setTimeZone(getBrowserTimeZone());
      setWeekStart(startOfWeek(now));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (days.length === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      days.forEach((day) => {
        const dayKey = day.toISOString();
        const scroller = dayScrollRefs.current[dayKey];

        if (scroller) {
          scroller.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_ROW_HEIGHT;
          updateDayScrollState(dayKey, scroller);
        }
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [days]);

  function updateDayScrollState(dayKey: string, scroller: HTMLDivElement) {
    const canScrollUp = scroller.scrollTop > 2;
    const canScrollDown = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2;

    setDayScrollState((current) => {
      const previous = current[dayKey];

      if (
        previous?.canScrollUp === canScrollUp &&
        previous.canScrollDown === canScrollDown
      ) {
        return current;
      }

      return {
        ...current,
        [dayKey]: { canScrollDown, canScrollUp },
      };
    });
  }

  function scrollDay(dayKey: string, direction: "down" | "up") {
    const scroller = dayScrollRefs.current[dayKey];

    if (!scroller) {
      return;
    }

    scroller.scrollBy({
      behavior: "smooth",
      top: HOUR_ROW_HEIGHT * 2 * (direction === "down" ? 1 : -1),
    });
  }

  function openSlot(day: Date, hour: number) {
    const start = makeLocalSlot(day, hour);
    const end = makeLocalSlot(day, hour + 1);

    setSelectedSlot({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  }

  function canCancelEvent(event: ScrimCalendarEvent) {
    if (!canManage) {
      return false;
    }

    if (event.kind === "availability") {
      return event.status === "OPEN" || event.status === "PENDING";
    }

    return event.kind === "scrim" && event.status === "CONFIRMED";
  }

  function cancelEvent(event: ScrimCalendarEvent) {
    startActionTransition(async () => {
      const response =
        event.kind === "availability"
          ? await fetch(`/api/scrims/availability/${event.id}`, { method: "DELETE" })
          : await fetch(`/api/scrims/matches/${event.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "cancel" }),
            });
      const label = event.kind === "availability" ? "Looking For Scrim block" : "scrim";

      setActionFeedback(await readMessage(response, `${label} cancelled.`));

      if (response.ok) {
        setPendingCancel(null);
        router.refresh();
      }
    });
  }

  if (!timeZone || !weekStart) {
    return (
      <section className="surface rounded-lg p-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-accent-strong" />
          <div>
            <p className="eyebrow">Local Calendar</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">Loading local time...</h2>
          </div>
        </div>
      </section>
    );
  }

  const currentZoneName = getTimeZoneName(new Date(), timeZone);

  return (
    <section className="surface rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-accent-strong" />
          <div>
            <p className="eyebrow">Local Calendar</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              {formatLocalMonthDay(weekStart, timeZone)} - {formatLocalMonthDay(addDays(weekStart, 6), timeZone)}
            </h2>
            <p className="mt-1 text-xs text-muted">{timeZone} · {currentZoneName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-line bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current ?? startOfWeek(new Date()), -7))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-100 transition hover:bg-white/6"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="h-9 rounded-full px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current ?? startOfWeek(new Date()), 7))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-100 transition hover:bg-white/6"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[1040px] grid-cols-7 gap-3">
          {days.map((day) => {
            const dayKey = day.toISOString();
            const scrollState = dayScrollState[dayKey] ?? {
              canScrollDown: true,
              canScrollUp: false,
            };

            return (
            <div key={dayKey} className="group overflow-hidden rounded-[18px] border border-line bg-white/4">
              <div className="border-b border-line bg-slate-950/35 px-3 py-3">
                <p className="text-sm font-semibold text-white">{formatLocalDay(day, timeZone)}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">
                  {getTimeZoneName(day, timeZone)}
                </p>
              </div>
              <div className="relative">
                <div
                  ref={(node) => {
                    dayScrollRefs.current[dayKey] = node;
                  }}
                  onScroll={(event) => updateDayScrollState(dayKey, event.currentTarget)}
                  className="calendar-day-scroll overflow-y-auto scroll-smooth"
                  style={{ maxHeight: HOUR_ROW_HEIGHT * VISIBLE_HOUR_ROWS }}
                  aria-label={`${formatLocalDay(day, timeZone)} scrollable hourly schedule`}
                >
                  {hours.map((hour) => {
                    const slotStart = makeLocalSlot(day, hour);
                    const slotEnd = makeLocalSlot(day, hour + 1);
                    const slotEvents = events.filter((event) =>
                      overlapsHour(event.startTime, event.endTime, slotStart, slotEnd),
                    );
                    const hasScheduledBlock = slotEvents.some(blocksNewAvailability);

                    return (
                      <div
                        key={hour}
                        className="relative border-b border-line px-3 py-3 last:border-b-0"
                        style={{ minHeight: HOUR_ROW_HEIGHT }}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{formatLocalHour(slotStart, timeZone)}</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                              {getTimeZoneName(slotStart, timeZone)}
                            </p>
                          </div>
                          {canManage && !hasScheduledBlock ? (
                            <button
                              type="button"
                              onClick={() => openSlot(day, hour)}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-slate-950/70 text-accent-strong transition hover:border-accent hover:bg-accent hover:text-slate-950"
                              aria-label={`Add Looking For Scrim block for ${formatLocalDay(day, timeZone)} at ${formatLocalHour(slotStart, timeZone)} ${getTimeZoneName(slotStart, timeZone)}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          {slotEvents.map((event) => (
                            <div
                              key={`${event.kind}-${event.id}`}
                              className={cn("rounded-[12px] border p-2", eventStyle(event))}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-1.5">
                                <div>
                                  <p className="text-xs font-semibold text-white">{eventTitle(event)}</p>
                                  {event.kind === "availability" ? (
                                    <p className="mt-0.5 text-[11px] leading-4 text-muted">
                                      {selectedTeam.name} · {selectedTeam.region}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ScrimStatusPill status={event.status} className="px-2 py-0.5 text-[9px]" />
                                  {canCancelEvent(event) ? (
                                    <button
                                      type="button"
                                      onClick={() => setPendingCancel(event)}
                                      disabled={isActionPending}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/40 bg-rose-300/10 text-rose-200 transition hover:bg-rose-300 hover:text-slate-950 disabled:opacity-50"
                                      aria-label={`Cancel ${eventTitle(event)}`}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              {event.kind !== "availability" && event.notes ? (
                                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">
                                  {event.notes}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-[#0a1724] to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a1724] to-transparent" />
                {scrollState.canScrollUp ? (
                  <div className="absolute inset-x-0 top-1 flex justify-center opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => scrollDay(dayKey, "up")}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line bg-slate-950/85 text-muted transition hover:border-accent hover:text-accent-strong"
                    aria-label={`Scroll ${formatLocalDay(day, timeZone)} earlier by two hours`}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                </div>
                ) : null}
                {scrollState.canScrollDown ? (
                  <div className="absolute inset-x-0 bottom-1 flex justify-center opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => scrollDay(dayKey, "down")}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line bg-slate-950/85 text-muted transition hover:border-accent hover:text-accent-strong"
                    aria-label={`Scroll ${formatLocalDay(day, timeZone)} later by two hours`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                ) : null}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1">
          Looking For Scrim
        </span>
        <span className="rounded-full border border-accent-strong/30 bg-accent-strong/10 px-3 py-1">
          Pending Request
        </span>
        <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1">
          Confirmed Scrim
        </span>
      </div>
      {actionFeedback ? <p className="mt-3 text-sm text-muted">{actionFeedback}</p> : null}

      {selectedSlot ? (
        <CalendarSlotModal
          slot={selectedSlot}
          teams={teams}
          selectedTeam={selectedTeam}
          requests={requests.filter((request) =>
            overlapsHour(request.startTime, request.endTime, new Date(selectedSlot.startTime), new Date(selectedSlot.endTime)),
          )}
          timeZone={timeZone}
          onClose={() => setSelectedSlot(null)}
        />
      ) : null}

      {pendingCancel ? (
        <ConfirmCancelDialog
          event={pendingCancel}
          isPending={isActionPending}
          onCancel={() => setPendingCancel(null)}
          onConfirm={() => cancelEvent(pendingCancel)}
        />
      ) : null}
    </section>
  );
}

function ConfirmCancelDialog({
  event,
  isPending,
  onCancel,
  onConfirm,
}: {
  event: ScrimCalendarEvent;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isLfs = event.kind === "availability";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{isLfs ? "Remove LFS" : "Cancel Scrim"}</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">
              {isLfs ? "Stop looking for a scrim?" : "Cancel this scrim?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white disabled:opacity-50"
            aria-label="Close cancel confirmation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">
          {isLfs
            ? "This removes the Looking For Scrim block and the hour will become blank again."
            : "This removes the confirmed scrim from both teams' calendars."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-rose-200 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            {isPending ? "Removing..." : isLfs ? "Remove LFS" : "Cancel scrim"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:opacity-50"
          >
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarSlotModal({
  slot,
  teams,
  selectedTeam,
  requests,
  timeZone,
  onClose,
}: {
  slot: SelectedSlot;
  teams: ScrimTeamOption[];
  selectedTeam: ScrimTeamOption;
  requests: ScrimRequestSummary[];
  timeZone: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const manageableTeams = teams.filter((team) => team.canManageScrims);
  const [tab, setTab] = useState<"availability" | "requests">("availability");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    teamId: selectedTeam.canManageScrims ? selectedTeam.id : manageableTeams[0]?.id ?? "",
    region: selectedTeam.region,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-line bg-[#0a1724] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Calendar Slot</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">Looking For Scrim</h2>
            <p className="mt-2 text-sm text-muted">
              {formatScheduleRangeInTimeZone(slot.startTime, slot.endTime, timeZone)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-white"
            aria-label="Close calendar slot modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 inline-flex rounded-full border border-line bg-white/5 p-1">
          {(["availability", "requests"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium capitalize transition",
                tab === item ? "bg-accent text-slate-950" : "text-slate-100 hover:bg-white/6",
              )}
            >
              {item === "availability" ? "Looking For Scrim" : `Requests (${requests.length})`}
            </button>
          ))}
        </div>

        {tab === "availability" ? (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();

              startTransition(async () => {
                const response = await fetch("/api/scrims/availability", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    teamId: form.teamId,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    region: form.region,
                  }),
                });

                setFeedback(await readMessage(response, "Availability block created."));

                if (response.ok) {
                  router.refresh();
                  onClose();
                }
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-200">
                Team
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
                  disabled={isPending}
                  className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
                >
                  {manageableTeams.map((team) => (
                    <option key={team.id} value={team.id} className="bg-slate-950">
                      {team.name} ({team.tag})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                Region
                <input
                  value={form.region}
                  onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                  disabled={isPending}
                  className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isPending || manageableTeams.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {isPending ? "Creating..." : "Set Looking For Scrim"}
              </button>
              {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            {requests.length > 0 ? (
              requests.map((request) => (
                <article key={request.id} className="rounded-[18px] border border-line bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-accent-strong">
                        {request.requestingTeamName} to {request.receivingTeamName}
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-bold text-white">
                        {request.requestingTeamRegion} · {request.requestingTeamRank}
                      </h3>
                    </div>
                    <ScrimStatusPill status={request.status} />
                  </div>
                  {request.message ? (
                    <p className="mt-3 flex gap-2 text-sm leading-6 text-slate-300">
                      <Send className="mt-1 h-4 w-4 shrink-0 text-accent-strong" />
                      {request.message}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-line bg-white/5 p-5">
                <p className="font-medium text-white">No requests for this hour</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Requests will appear here once another team asks for this block.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
