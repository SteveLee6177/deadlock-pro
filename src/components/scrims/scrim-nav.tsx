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
  currentUnreadChatCount = 0,
  incomingCount = 0,
  sentCount = 0,
}: {
  active: "calendar" | "find" | "current" | "incoming" | "sent";
  currentCount?: number;
  currentUnreadChatCount?: number;
  incomingCount?: number;
  sentCount?: number;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.key === active;
        const hasIncomingAlert = link.key === "incoming" && incomingCount > 0;
        const hasChatAlert = link.key === "current" && currentUnreadChatCount > 0;
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
              hasIncomingAlert
                ? "border-success/70 bg-success/15 text-success shadow-[0_0_24px_rgba(114,209,178,0.18)] hover:bg-success/20"
                : hasChatAlert
                  ? "border-success/70 bg-success/15 text-success shadow-[0_0_24px_rgba(114,209,178,0.18)] hover:bg-success/20"
                : isActive
                ? "border-accent bg-accent text-slate-950"
                : "border-line bg-white/5 text-slate-100 hover:border-accent/50",
              hasIncomingAlert && isActive && "bg-success text-slate-950",
              hasChatAlert && isActive && "bg-success text-slate-950",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
            {hasChatAlert ? (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                isActive ? "bg-slate-950 text-white" : "bg-success text-slate-950",
              )}>
                {currentUnreadChatCount}
              </span>
            ) : null}
            {count !== null ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  hasIncomingAlert
                    ? "bg-success text-slate-950"
                    : "bg-slate-950 text-white",
                  hasIncomingAlert && isActive && "bg-slate-950 text-white",
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
