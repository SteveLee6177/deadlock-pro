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

function compactClock(value: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value.toLowerCase() ?? "";

  return minute === "00" ? `${hour}${dayPeriod}` : `${hour}:${minute}${dayPeriod}`;
}

function compactDate(value: string | Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone,
    weekday: "short",
  }).format(new Date(value));
}

export function LocalCompactTimeRange({
  start,
  end,
}: {
  start: string | Date;
  end: string | Date;
}) {
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const label = useMemo(
    () => (timeZone ? `${compactClock(start, timeZone)}-${compactClock(end, timeZone)}` : "Time"),
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

export function LocalCompactDate({
  value,
}: {
  value: string | Date;
}) {
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const label = useMemo(
    () => (timeZone ? compactDate(value, timeZone) : "Local date"),
    [timeZone, value],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTimeZone(getBrowserTimeZone());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <time dateTime={new Date(value).toISOString()} suppressHydrationWarning>
      {label}
    </time>
  );
}
