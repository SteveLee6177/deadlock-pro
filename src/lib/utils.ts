import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatScheduleRange(start: string | Date, end: string | Date) {
  return `${format(start, "EEE, MMM d")} · ${format(start, "p")} - ${format(end, "p")}`;
}
