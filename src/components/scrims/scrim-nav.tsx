import Link from "next/link";
import { CalendarDays, Inbox, Search, Send, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/scrims/calendar", label: "Calendar", icon: CalendarDays, key: "calendar" },
  { href: "/scrims/find", label: "Find Scrims", icon: Search, key: "find" },
  { href: "/scrims/current", label: "Current Scrims", icon: Swords, key: "current" },
  { href: "/scrims/requests#incoming", label: "Incoming Scrims", icon: Inbox, key: "incoming" },
  { href: "/scrims/requests#sent", label: "Sent Scrims", icon: Send, key: "sent" },
];

export function ScrimNav({
  active,
  currentCount = 0,
  incomingCount = 0,
  sentCount = 0,
}: {
  active: "calendar" | "find" | "current" | "incoming" | "sent";
  currentCount?: number;
  incomingCount?: number;
  sentCount?: number;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.key === active;
        const count =
          link.key === "incoming"
            ? incomingCount
            : link.key === "sent"
              ? sentCount
              : link.key === "current"
                ? currentCount
                : null;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
              isActive
                ? "border-accent bg-accent text-slate-950"
                : "border-line bg-white/5 text-slate-100 hover:border-accent/50",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
            {count !== null ? (
              <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs text-white">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
