import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Clock, ShieldAlert, UserCheck } from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";
import { RankBadge } from "@/components/rank-badge";
import { TeamInviteActions } from "@/components/team-invite-actions";
import { getCurrentUser } from "@/lib/auth";
import { canUseDatabase } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { isActiveTeamInvite } from "@/lib/team-invites";

type TeamInvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function TeamInvitePage({ params }: TeamInvitePageProps) {
  const { token } = await params;
  const user = await getCurrentUser();

  const team = (await canUseDatabase())
    ? await prisma.team.findUnique({
        where: { inviteToken: token },
        select: {
          id: true,
          slug: true,
          name: true,
          tag: true,
          region: true,
          primaryRank: true,
          primaryRankBadgeLevel: true,
          inviteExpiresAt: true,
        },
      })
    : null;
  const currentMembership =
    user && team && (await canUseDatabase())
      ? await prisma.teamMembership.findFirst({
          where: { userId: user.id },
          include: { team: { select: { id: true, name: true } } },
        })
      : null;
  const inviteIsActive = Boolean(team && isActiveTeamInvite(team.inviteExpiresAt));
  const returnTo = `/invite/${token}`;

  let content: ReactNode;

  if (!team || !inviteIsActive) {
    content = (
      <>
        <ShieldAlert className="h-8 w-8 text-rose-100" />
        <p className="eyebrow mt-5">Invite Expired</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          This invite link is no longer active.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Ask the team owner or manager for a fresh 24-hour invite link.
        </p>
      </>
    );
  } else if (!user) {
    content = (
      <>
        <UserCheck className="h-8 w-8 text-accent-strong" />
        <p className="eyebrow mt-5">Team Invite</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          Sign in to join {team.name}.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Verify with Steam first, then you can accept this team invite.
        </p>
        <Link
          href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
        >
          Sign in with Steam
          <ArrowRight className="h-4 w-4" />
        </Link>
      </>
    );
  } else if (currentMembership?.teamId === team.id) {
    content = (
      <>
        <CheckCircle2 className="h-8 w-8 text-success" />
        <p className="eyebrow mt-5">Already Rostered</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          You&apos;re on this team already.
        </h1>
        <Link
          href={`/teams?team=${team.slug}`}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/6"
        >
          Go to My Team
          <ArrowRight className="h-4 w-4" />
        </Link>
      </>
    );
  } else {
    content = (
      <>
        <Clock className="h-8 w-8 text-accent-strong" />
        <p className="eyebrow mt-5">Team Invite</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          Join {team.name}.
        </h1>
        <div className="mt-5 flex items-center gap-3 text-lg leading-8 text-slate-300">
          <span>
            {team.tag} · {team.region}
          </span>
          <RankBadge
            badgeLevel={team.primaryRankBadgeLevel}
            rank={team.primaryRank}
            size="md"
          />
        </div>
        <TeamInviteActions currentTeamName={currentMembership?.team.name} token={token} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="surface-strong rounded-lg p-8 md:p-10">
          {content}
        </section>
      </main>
    </div>
  );
}
