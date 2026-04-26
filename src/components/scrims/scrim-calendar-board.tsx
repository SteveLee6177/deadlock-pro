"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays } from "lucide-react";
import { LocalScheduleRange } from "@/components/local-schedule-range";
import { ScrimStatusPill } from "@/components/scrims/scrim-status-pill";
import { cn } from "@/lib/utils";
import type { ScrimCalendarEvent } from "@/lib/types";

const KIND_STYLES: Record<ScrimCalendarEvent["kind"], string> = {
  availability: "border-success/30 bg-success/10",
  request: "border-accent-strong/30 bg-accent-strong/10",
  scrim: "border-sky-300/30 bg-sky-300/10",
};

function getEventStyle(event: ScrimCalendarEvent) {
  if (event.status === "CANCELLED") {
    return "border-rose-300/30 bg-rose-300/10";
  }

  if (event.status === "BOOKED" || event.status === "CONFIRMED" || event.status === "ACCEPTED") {
    return "border-sky-300/30 bg-sky-300/10";
  }

  return KIND_STYLES[event.kind];
}

export function ScrimCalendarBoard({
  events,
  defaultView = "week",
}: {
  events: ScrimCalendarEvent[];
  defaultView?: "month" | "week" | "day";
}) {
  const [view, setView] = useState<"month" | "week" | "day">(defaultView);
  const [today, setToday] = useState<Date | null>(null);
  const weekDays = useMemo(
    () => (today ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(today), index)) : []),
    [today],
  );
  const monthDays = useMemo(
    () =>
      today
        ? Array.from({ length: 35 }, (_, index) => addDays(startOfWeek(startOfMonth(today)), index))
        : [],
    [today],
  );
  const visibleDays = view === "month" ? monthDays : view === "week" ? weekDays : today ? [today] : [];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setToday(new Date());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!today) {
    return (
      <section className="surface rounded-[28px] p-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-accent-strong" />
          <div>
            <p className="eyebrow">Team Calendar</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-white">Loading local time...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface rounded-[28px] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-accent-strong" />
          <div>
            <p className="eyebrow">Team Calendar</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-white">
              {format(today, "MMMM yyyy")}
            </h2>
          </div>
        </div>
        <div className="inline-flex w-fit rounded-full border border-line bg-white/5 p-1">
          {(["month", "week", "day"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium capitalize transition",
                view === item ? "bg-accent text-slate-950" : "text-slate-100 hover:bg-white/6",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mt-6 grid gap-3",
          view === "day" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-7",
        )}
      >
        {visibleDays.map((day) => {
          const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), day));

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-36 rounded-[18px] border border-line bg-white/4 p-3",
                isSameDay(day, today) ? "border-accent/50" : "",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-white">{format(day, "EEE")}</p>
                <p className="text-xs text-muted">{format(day, "MMM d")}</p>
              </div>
              <div className="mt-3 space-y-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <div
                      key={`${event.kind}-${event.id}`}
                      className={cn("rounded-[14px] border p-3", getEventStyle(event))}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{event.title}</p>
                        <ScrimStatusPill status={event.status} className="px-2 py-0.5 text-[10px]" />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-300">
                        <LocalScheduleRange start={event.startTime} end={event.endTime} />
                      </p>
                      {event.notes ? (
                        <p className="mt-2 text-xs leading-5 text-muted">{event.notes}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-[14px] border border-line bg-white/5 p-3 text-xs text-muted">
                    No scrims.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted">
        <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1">
          Open Availability
        </span>
        <span className="rounded-full border border-accent-strong/30 bg-accent-strong/10 px-3 py-1">
          Pending Request
        </span>
        <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1">
          Confirmed Scrim
        </span>
        <span className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1">
          Cancelled Scrim
        </span>
      </div>
    </section>
  );
}
