"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatScheduleRangeInTimeZone,
  getBrowserTimeZone,
} from "@/lib/time-zone";

export function LocalScheduleRange({
  start,
  end,
}: {
  start: string | Date;
  end: string | Date;
}) {
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const label = useMemo(
    () => (timeZone ? formatScheduleRangeInTimeZone(start, end, timeZone) : "Local time"),
    [end, start, timeZone],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTimeZone(getBrowserTimeZone());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <time dateTime={new Date(start).toISOString()} suppressHydrationWarning>
      {label}
    </time>
  );
}
