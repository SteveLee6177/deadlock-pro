const TIME_ZONE_OFFSET_PATTERN = /(?:z|[+-]\d{2}:?\d{2})$/i;

function dateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getTimeZoneName(value: string | Date, timeZone: string) {
  const date = new Date(value);
  const zoneName = new Intl.DateTimeFormat(undefined, {
    timeZone,
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return zoneName ?? timeZone;
}

export function formatScheduleRangeInTimeZone(
  start: string | Date,
  end: string | Date,
  timeZone: string,
) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone,
    weekday: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  const startZone = getTimeZoneName(startDate, timeZone);
  const endZone = getTimeZoneName(endDate, timeZone);

  if (dateKey(startDate, timeZone) === dateKey(endDate, timeZone)) {
    const zone = startZone === endZone ? startZone : `${startZone}/${endZone}`;

    return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)} ${zone}`;
  }

  return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} ${startZone} - ${dateFormatter.format(endDate)} · ${timeFormatter.format(endDate)} ${endZone}`;
}

export function toLocalInputValue(value: string | Date) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function toUtcIsoFromLocalInput(value: string) {
  if (!value) {
    return value;
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date.toISOString() : value;
}

export function parseAbsoluteDateTime(value: string) {
  if (!TIME_ZONE_OFFSET_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}
