import { formatDistanceToNow } from "date-fns";
import { CalendarClock, Video } from "lucide-react";
import { LocalScheduleRange } from "@/components/local-schedule-range";
import type { ScheduleFeedEvent } from "@/lib/types";

export function ScheduleList({
  events,
  compact = false,
}: {
  events: ScheduleFeedEvent[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="surface rounded-lg p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent-strong">{event.type}</p>
              <h3 className="mt-2 font-display text-xl font-bold text-white">{event.title}</h3>
              {!compact ? <p className="mt-2 text-sm text-muted">{event.teamName}</p> : null}
            </div>
            <div className="text-sm text-muted">
              Starts {formatDistanceToNow(new Date(event.startsAt), { addSuffix: true })}
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-accent-strong" />
              <LocalScheduleRange start={event.startsAt} end={event.endsAt} />
            </div>
            {event.location ? (
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-accent-strong" />
                {event.location}
              </div>
            ) : null}
          </div>

          {event.notes ? <p className="mt-4 text-sm leading-7 text-slate-200">{event.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
