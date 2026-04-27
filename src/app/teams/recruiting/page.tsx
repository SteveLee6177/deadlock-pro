import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { SiteHeader } from "@/components/navigation/site-header";
import { TeamRecruitingForm } from "@/components/team-recruiting-form";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserTeamWorkspace } from "@/lib/platform-data";

const RECRUITING_MANAGER_ROLES = new Set(["OWNER", "MANAGER", "CAPTAIN"]);

type RecruitingPageProps = {
  searchParams?: Promise<{ team?: string | string[] }>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function canManageRecruiting(role: string | undefined) {
  return Boolean(role && RECRUITING_MANAGER_ROLES.has(role));
}

export default async function TeamRecruitingPage({ searchParams }: RecruitingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const teamSlug = asString(resolvedSearchParams.team);
  const [user, workspace] = await Promise.all([
    getCurrentUser(),
    getCurrentUserTeamWorkspace(teamSlug),
  ]);
  const teamHref = workspace ? `/teams?team=${workspace.team.slug}` : "/teams";
  const canManage = canManageRecruiting(workspace?.userRole);

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Link href={teamHref} className="inline-flex items-center gap-2 text-sm text-accent-strong">
          <ArrowLeft className="h-4 w-4" />
          Back to my team
        </Link>

        <section className="border-b border-line/60 pb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-line bg-white/5 p-3 text-accent-strong">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Recruiting Settings</p>
              <h1 className="mt-2 font-display text-5xl font-bold tracking-tight text-white">
                {workspace ? `${workspace.team.name} recruiting` : "Team recruiting"}
              </h1>
            </div>
          </div>
        </section>

        {!user ? (
          <GuestAccessCard
            eyebrow="Steam Required"
            title="Sign in before changing recruiting"
            description="Recruiting settings are limited to verified team owners and managers."
          />
        ) : !workspace ? (
          <GuestAccessCard
            eyebrow="No Team"
            title="Join or create a team first"
            description="Recruiting settings unlock once you have a team to manage."
            ctaLabel="Browse Teams"
            ctaHref="/teams"
          />
        ) : canManage ? (
          <TeamRecruitingForm team={workspace.team} />
        ) : (
          <GuestAccessCard
            eyebrow="Manager Access"
            title="Only team leadership can change recruiting"
            description="Ask the owner, manager, or captain to update the team's recruiting settings."
            ctaLabel="Back to My Team"
            ctaHref={teamHref}
          />
        )}
      </main>
    </div>
  );
}
