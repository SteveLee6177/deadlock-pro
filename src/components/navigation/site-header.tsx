"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PlusCircle, Search, Swords, Trophy, Tv, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { FocusEvent } from "react";
import { TeamInviteBell } from "@/components/navigation/team-invite-bell";
import { RankBadge } from "@/components/rank-badge";
import type { SessionUser, UserTeamOption } from "@/lib/types";

const navItems = [
  { href: "/scrims/calendar", label: "Scrims", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
];

const RECRUITING_MANAGER_ROLES = new Set(["OWNER", "MANAGER", "CAPTAIN"]);

function TeamsNavMenu({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<UserTeamOption[] | null>(user ? null : []);

  useEffect(() => {
    let active = true;

    if (!user) {
      return () => {
        active = false;
      };
    }

    function loadTeams() {
      setTeams(null);

      fetch("/api/profile/teams", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { teams: [] }))
        .then((payload: { teams?: UserTeamOption[] }) => {
          if (active) {
            setTeams(payload.teams ?? []);
          }
        })
        .catch(() => {
          if (active) {
            setTeams([]);
          }
        });
    }

    loadTeams();
    window.addEventListener("team-memberships-changed", loadTeams);

    return () => {
      active = false;
      window.removeEventListener("team-memberships-changed", loadTeams);
    };
  }, [pathname, user]);

  const primaryTeam = teams?.[0] ?? null;
  const ownTeamHref = primaryTeam ? `/teams?team=${primaryTeam.slug}` : "/teams";
  const recruitingHref = primaryTeam ? `/teams/recruiting?team=${primaryTeam.slug}` : "/teams/recruiting";
  const canManageRecruiting = Boolean(
    primaryTeam && RECRUITING_MANAGER_ROLES.has(primaryTeam.role),
  );

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocus = event.relatedTarget;

    if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
      setOpen(false);
    }
  }

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/6 hover:text-white"
      >
        <Users className="h-4 w-4" />
        Teams
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute left-0 top-full z-50 w-56 pt-2 transition ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div
          role="menu"
          className="rounded-lg border border-line bg-[#07131e] p-2 shadow-2xl shadow-black/30"
        >
          {primaryTeam ? (
            <Link
              role="menuitem"
              href={ownTeamHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-100 transition hover:bg-white/6"
            >
              <Users className="h-4 w-4 text-accent-strong" />
              My Team
            </Link>
          ) : null}
          {canManageRecruiting ? (
            <Link
              role="menuitem"
              href={recruitingHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-100 transition hover:bg-white/6"
            >
              <UserPlus className="h-4 w-4 text-accent-strong" />
              Recruiting Settings
            </Link>
          ) : null}
          <Link
            role="menuitem"
            href={primaryTeam ? "/teams?view=browse" : "/teams"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-100 transition hover:bg-white/6"
          >
            <Search className="h-4 w-4 text-accent-strong" />
            Browse Teams
          </Link>
          {user && teams === null ? (
            <div className="px-3 py-2 text-sm text-muted">Checking team...</div>
          ) : null}
          {!primaryTeam && teams !== null ? (
            <Link
              role="menuitem"
              href={user ? "/teams/create" : "/sign-in"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-100 transition hover:bg-white/6"
            >
              <PlusCircle className="h-4 w-4 text-accent-strong" />
              Create Team
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-[#07131e]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-sm font-black text-slate-950 shadow-lg shadow-accent/20">
            SL
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">Scrimlock</p>
            <p className="text-xs text-muted">
              Fast scrims and serious team practice.
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <TeamsNavMenu user={user} />
          {navItems.map(({ href, label, icon: Icon }) => (
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
              <TeamInviteBell />
              <Link
                href="/profile"
                aria-label={`Open ${user.profileName}'s profile`}
                title={`Open profile for ${user.profileName}`}
                className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-white/4 px-4 py-2 text-sm transition hover:border-accent/40 hover:bg-white/6 focus:outline-none focus:ring-2 focus:ring-accent/50 md:flex"
              >
                <span className="whitespace-nowrap text-slate-100">
                  <span className="text-muted">Signed in as </span>
                  <span className="font-semibold text-white">{user.profileName}</span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success/20 bg-success/15">
                  <RankBadge
                    badgeLevel={user.deadlockRankBadgeLevel}
                    rank={user.deadlockRank}
                    size="sm"
                  />
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/sign-in"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
              Verify Steam
            </Link>
          )}
          <Link
            href="/tournaments"
            className="hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-slate-100 transition hover:bg-white/6 md:flex"
          >
            <Tv className="h-4 w-4" />
            Watch feed
          </Link>
        </div>
      </div>
    </header>
  );
}
