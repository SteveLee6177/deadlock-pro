import Link from "next/link";
import { CalendarDays, ClipboardList, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/scrims", label: "Overview", icon: LayoutDashboard },
  { href: "/scrims/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/scrims/find", label: "Find Scrims", icon: Search },
  { href: "/scrims/requests", label: "Requests", icon: ClipboardList },
];

export function ScrimNav({
  active,
  pendingCount = 0,
}: {
  active: "overview" | "calendar" | "find" | "requests";
  pendingCount?: number;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          (active === "overview" && link.href === "/scrims") ||
          (active !== "overview" && link.href.endsWith(active));

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
            {link.label === "Requests" && pendingCount > 0 ? (
              <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs text-white">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
