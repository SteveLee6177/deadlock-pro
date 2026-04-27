"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TeamCard } from "@/components/team-card";
import type { TeamSummary } from "@/lib/types";

export function TeamDirectoryExplorer({ teams }: { teams: TeamSummary[] }) {
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All roles");
  const [selectedStatus, setSelectedStatus] = useState(() =>
    teams.some((team) => team.recruiting) ? "Recruiting" : "All teams",
  );

  const roleFilters = useMemo(() => {
    const roles = new Set<string>();

    teams.forEach((team) => {
      team.openRoles.forEach((role) => roles.add(role));
    });

    return ["All roles", ...Array.from(roles).sort()];
  }, [teams]);

  const visibleTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [team.name, team.tag, team.region, team.focus, team.primaryRank, team.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesRole =
        selectedRole === "All roles" || team.openRoles.some((role) => role === selectedRole);

      const matchesStatus =
        selectedStatus === "All teams" ||
        (selectedStatus === "Recruiting" && team.recruiting) ||
        (selectedStatus === "Closed" && !team.recruiting);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, selectedRole, selectedStatus, teams]);

  return (
    <section id="browse-teams">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Team Directory</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-white">Browse teams</h2>
        </div>
        <label className="flex min-h-12 items-center gap-3 rounded-full border border-line bg-white/5 px-4 text-sm text-slate-100 focus-within:border-accent lg:w-96">
          <Search className="h-4 w-4 text-accent-strong" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by team, region, rank, role, or focus"
            className="w-full bg-transparent py-3 outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["Recruiting", "All teams", "Closed"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              selectedStatus === status
                ? "border-accent bg-accent text-slate-950"
                : "border-line bg-white/5 text-slate-100 hover:border-accent/50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {roleFilters.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              selectedRole === role
                ? "border-accent bg-accent text-slate-950"
                : "border-line bg-white/5 text-slate-100 hover:border-accent/50"
            }`}
          >
            {role === "All roles" ? role : `Trialing ${role}`}
          </button>
        ))}
      </div>

      {visibleTeams.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-3">
          {visibleTeams.map((team) => (
            <TeamCard key={team.id} team={team} showQuickApply />
          ))}
        </div>
      ) : (
        <div className="surface rounded-lg p-8 text-center">
          <p className="font-display text-2xl font-bold text-white">No teams match that search.</p>
          <p className="mt-2 text-sm text-muted">
            Clear the filter or broaden the region, role, or rank target.
          </p>
        </div>
      )}
    </section>
  );
}
