"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import type { ScheduleFeedEvent } from "@/lib/types";
import { ScheduleList } from "@/components/schedule-list";

function mergeEvent(
  previous: ScheduleFeedEvent[],
  incoming: ScheduleFeedEvent,
): ScheduleFeedEvent[] {
  const next = [incoming, ...previous.filter((event) => event.id !== incoming.id)];
  return next
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 12);
}

export function LiveScheduleBoard({
  initialEvents,
  teamId = "all",
  liveEnabled = false,
}: {
  initialEvents: ScheduleFeedEvent[];
  teamId?: string;
  liveEnabled?: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [status, setStatus] = useState<"connecting" | "live" | "fallback">(
    liveEnabled ? "connecting" : "fallback",
  );

  useEffect(() => {
    if (!liveEnabled) {
      return;
    }

    const source = new EventSource(`/api/live/schedule?teamId=${teamId}`);

    source.onopen = () => setStatus("live");
    source.onerror = () => {
      setStatus("fallback");
      source.close();
    };
    source.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data) as ScheduleFeedEvent & { kind?: string };

        if (payload.kind === "status") {
          if (payload.title === "disabled") {
            setStatus("fallback");
            source.close();
          }
          return;
        }

        setEvents((previous) => mergeEvent(previous, payload));
      } catch {
        setStatus("fallback");
      }
    };

    return () => source.close();
  }, [liveEnabled, teamId]);

  const currentStatus = liveEnabled ? status : "fallback";

  const indicator = useMemo(() => {
    if (currentStatus === "live") {
      return {
        icon: <Radio className="h-4 w-4" />,
        label: "Live Redis updates connected",
      };
    }

    if (currentStatus === "fallback") {
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        label: liveEnabled
          ? "Live sync paused, showing current schedule snapshot"
          : "Showing current schedule snapshot",
      };
    }

    return {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      label: "Connecting to live schedule feed",
    };
  }, [currentStatus, liveEnabled]);

  return (
    <section className="surface-strong rounded-[32px] p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Live Schedule</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white">
            Team calendar without refreshes
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-muted">
          {indicator.icon}
          {indicator.label}
        </div>
      </div>

      <ScheduleList events={events} />
    </section>
  );
}
