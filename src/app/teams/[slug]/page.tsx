import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GuestAccessCard } from "@/components/access/guest-access-card";
import { DiscordCopyButton } from "@/components/discord-copy-button";
import { SteamIcon } from "@/components/icons/steam-icon";
import { SiteHeader } from "@/components/navigation/site-header";
import { RankBadge } from "@/components/rank-badge";
import { ScheduleList } from "@/components/schedule-list";
import { StatlockerProfileLink } from "@/components/statlocker-profile-link";
import { TeamMemberKickButton } from "@/components/team-member-kick-button";
import { TeamJoinForm } from "@/components/team-join-form";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { getTeamProfile } from "@/lib/platform-data";
import { getSteamProfileUrl } from "@/lib/steam-profile";
import type { TeamProfile } from "@/lib/types";

type TeamPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    from?: string | string[];
    source?: string | string[];
  }>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function canApplyToTeam(team: TeamProfile) {
  return team.recruiting && team.currentUserCanApply !== false;
}

function canKickTeamMembers(role: string | undefined) {
  return role === "OWNER" || role === "MANAGER";
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const profileSource =
    asString(resolvedSearchParams.from) ?? asString(resolvedSearchParams.source);
  const [user, team, membershipData] = await Promise.all([
    getCurrentUser(),
    getTeamProfile(slug),
    getCurrentUserMemberships(),
  ]);

  if (!team) {
    notFound();
  }

  const memberships = membershipData?.memberships ?? [];
  const ownTeamMembership = memberships.find((membership) => membership.team.slug === slug);
  const canViewRosteredTeamProfile = Boolean(
    ownTeamMembership && profileSource === "my-team",
  );
  const canKickMembers = canKickTeamMembers(ownTeamMembership?.role);

  if (memberships.length > 0 && !canViewRosteredTeamProfile) {
    redirect(memberships[0]?.team.slug ? `/teams?team=${memberships[0].team.slug}` : "/teams");
  }

  const backHref = canViewRosteredTeamProfile ? `/teams?team=${team.slug}` : "/teams";
  const backLabel = canViewRosteredTeamProfile ? "Back to my team" : "Back to team directory";

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-accent-strong">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <section className="grid gap-8 xl:grid-cols-[1fr_0.85fr]">
          <div className="surface-strong rounded-lg p-8 md:p-10">
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
              {team.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                {team.region}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
                <RankBadge
                  badgeLevel={team.primaryRankBadgeLevel}
                  rank={team.primaryRank}
                  size="sm"
                />
              </span>
              <span className="rounded-full border border-line bg-white/5 px-4 py-2 text-slate-100">
                {team.availability}
              </span>
            </div>
            {team.description ? (
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{team.description}</p>
            ) : null}
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{team.focus}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {team.openRoles.length > 0 ? (
                team.openRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-slate-100"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-muted">
                  Closed roster
                </span>
              )}
            </div>
          </div>

          {user && canApplyToTeam(team) ? (
            <TeamJoinForm slug={team.slug} disabled={false} />
          ) : (
            <GuestAccessCard
              eyebrow="View Only"
              title={user ? "Roster access only" : "Applications unlock after Steam sign-in"}
              description={
                user
                  ? "This team's roster remains visible, but applications are no longer available for your profile."
                  : "Roster standards stay visible for guests, but applying requires a signed-in Steam identity."
              }
              ctaHref={user ? "#roster" : "/sign-in"}
              ctaLabel={user ? "View roster" : "Sign in with Steam"}
            />
          )}
        </section>

        <section id="roster" className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="surface rounded-lg p-6">
            <p className="eyebrow">Roster</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">Current members</h2>
            <div className="mt-6 space-y-4">
              {team.members.map((member) => (
                <div key={member.id} className="rounded-lg border border-line bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{member.profileName}</p>
                      <p className="mt-1 text-sm text-muted">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={getSteamProfileUrl(member.steamId)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${member.profileName}'s Steam profile`}
                        title="Open Steam profile"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
                      >
                        <SteamIcon className="h-4 w-4" />
                      </a>
                      <StatlockerProfileLink
                        steamId={member.steamId}
                        profileName={member.profileName}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6"
                        iconClassName="h-4 w-4"
                      />
                      {member.discordUsername ? (
                        <DiscordCopyButton
                          profileName={member.profileName}
                          username={member.discordUsername}
                          size="sm"
                        />
                      ) : null}
                      {canKickMembers && member.id !== user?.id && member.role !== "OWNER" ? (
                        <TeamMemberKickButton
                          memberName={member.profileName}
                          slug={team.slug}
                          userId={member.id}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3">
                    <RankBadge
                      badgeLevel={member.deadlockRankBadgeLevel}
                      rank={member.deadlockRank}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <p className="eyebrow">Upcoming Schedule</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                Practice, scrim, and review blocks
              </h2>
            </div>
            <ScheduleList events={team.upcomingSchedule} />
          </div>
        </section>
      </main>
    </div>
  );
}
