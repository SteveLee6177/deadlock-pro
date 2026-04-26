import Link from "next/link";
import { Filter, Search, Users } from "lucide-react";
import { RequestScrimButton } from "@/components/scrims/scrim-actions";
import { ScrimNav } from "@/components/scrims/scrim-nav";
import {
  AvailabilityBlockCard,
  EmptyScrimState,
} from "@/components/scrims/scrim-summary-cards";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import {
  getCurrentScrimTeams,
  getOpenAvailabilityBlocks,
  getScrimWorkspace,
  type ScrimDiscoveryFilters,
} from "@/lib/scrim-data";

type FindScrimsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function FilterInput({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
      />
    </label>
  );
}

export default async function FindScrimsPage({ searchParams }: FindScrimsPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const filters: ScrimDiscoveryFilters = {
    date: valueOf(resolved.date),
    timeFrom: valueOf(resolved.timeFrom),
    timeTo: valueOf(resolved.timeTo),
    region: valueOf(resolved.region),
    rank: valueOf(resolved.rank),
    teamStatus: valueOf(resolved.teamStatus),
  };
  const [user, teams, blocks, workspace] = await Promise.all([
    getCurrentUser(),
    getCurrentScrimTeams(),
    getOpenAvailabilityBlocks(filters),
    getScrimWorkspace(),
  ]);
  const pendingCount = workspace.incomingRequests.filter((request) => request.status === "PENDING").length;
  const ownTeamIds = new Set(teams.map((team) => team.id));
  const visibleBlocks = blocks.filter((block) => !ownTeamIds.has(block.teamId));

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <ScrimNav active="find" pendingCount={pendingCount} />

        <section className="surface-strong rounded-[36px] p-8 md:p-10">
          <p className="eyebrow">Find Scrims</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Browse open scrim blocks from other teams.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Discovery stays public. Official requests are reserved for team owners and managers.
          </p>
          {teams.length === 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/teams#create-team"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
              >
                <Users className="h-4 w-4" />
                Create Team
              </Link>
              <Link
                href="/teams#browse-teams"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
              >
                <Search className="h-4 w-4" />
                Browse Teams
              </Link>
            </div>
          ) : null}
        </section>

        <form className="surface rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-accent-strong" />
            <div>
              <p className="eyebrow">Filters</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-white">Narrow the board</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <FilterInput name="date" label="Date" type="date" defaultValue={filters.date} />
            <FilterInput name="timeFrom" label="From" type="time" defaultValue={filters.timeFrom} />
            <FilterInput name="timeTo" label="To" type="time" defaultValue={filters.timeTo} />
            <FilterInput
              name="region"
              label="Region"
              defaultValue={filters.region}
              placeholder="NA East"
            />
            <FilterInput
              name="rank"
              label="Skill / rank"
              defaultValue={filters.rank}
              placeholder="Oracle"
            />
            <label className="grid gap-2 text-sm text-slate-200">
              Team status
              <select
                name="teamStatus"
                defaultValue={filters.teamStatus ?? "Any status"}
                className="h-11 rounded-[14px] border border-line bg-white/5 px-3 text-sm text-white outline-none focus:border-accent"
              >
                <option className="bg-slate-950">Any status</option>
                <option className="bg-slate-950">Recruiting</option>
                <option className="bg-slate-950">Closed</option>
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
            >
              <Search className="h-4 w-4" />
              Apply filters
            </button>
            <Link
              href="/scrims/find"
              className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6"
            >
              Reset
            </Link>
          </div>
        </form>

        <section>
          <div className="mb-6">
            <p className="eyebrow">Open Blocks</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white">
              {visibleBlocks.length} available window{visibleBlocks.length === 1 ? "" : "s"}
            </h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {visibleBlocks.map((block) => (
              <AvailabilityBlockCard
                key={block.id}
                block={block}
                action={<RequestScrimButton block={block} teams={teams} />}
              />
            ))}
            {visibleBlocks.length === 0 ? (
              <EmptyScrimState
                title="No matching blocks"
                detail="Try a broader date, region, rank, or team-status filter. Your own teams' blocks are hidden here."
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
