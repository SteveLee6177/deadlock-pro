import Link from "next/link";
import { Swords, Trophy, Tv, UserCircle, Users } from "lucide-react";
import type { SessionUser } from "@/lib/types";

const navItems = [
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/scrims", label: "Scrims", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const visibleNavItems = user ? navItems : navItems.filter((item) => item.href !== "/profile");

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-[#07131e]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-sm font-black text-slate-950 shadow-lg shadow-accent/20">
            DP
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">Deadlock Pro</p>
            <p className="text-xs text-muted">
              The community ops layer for teams, scrims, and events.
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {visibleNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/6 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden rounded-full border border-line bg-white/4 px-4 py-2 text-sm md:block">
                <span className="text-muted">Signed in as </span>
                <span className="font-medium">{user.profileName}</span>
                {user.deadlockRank ? (
                  <span className="ml-2 rounded-full bg-success/15 px-2 py-1 text-xs text-success">
                    {user.deadlockRank}
                  </span>
                ) : null}
              </div>
              <form action="/api/auth/signout" method="post">
                <button className="rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-white/6">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
            >
              Sign in with Steam
            </Link>
          )}
          <Link
            href="/tournaments"
            className="hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-slate-100 transition hover:bg-white/6 md:flex"
          >
            <Tv className="h-4 w-4" />
            Live now
          </Link>
        </div>
      </div>
    </header>
  );
}
