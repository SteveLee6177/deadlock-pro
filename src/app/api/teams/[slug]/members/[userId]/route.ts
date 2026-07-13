import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { teamApplicationDeclineData } from "@/lib/team-applications";
import { recalculateTeamRank } from "@/lib/team-ranks";

const memberActionSchema = z.object({
  action: z.enum(["promote-trial", "remove-trial", "remove-member"]),
});

const TEAM_TRIAL_MANAGER_ROLES = new Set(["OWNER", "MANAGER"]);

function canManageTrials(role: string | null | undefined) {
  return Boolean(role && TEAM_TRIAL_MANAGER_ROLES.has(role));
}

function canRemoveMember(managerRole: string | null | undefined, memberRole: string) {
  return canManageTrials(managerRole) && memberRole !== "OWNER";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; userId: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so roster trials cannot be changed yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const [{ slug, userId }, body] = await Promise.all([
    context.params,
    request.json().catch(() => null),
  ]);
  const parsed = memberActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a valid roster action." }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  if (!canManageTrials(team.memberships[0]?.role)) {
    return NextResponse.json({ message: "Only team captains and managers can manage trial players." }, { status: 403 });
  }

  const trialMembership = await prisma.teamMembership.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId,
      },
    },
    include: {
      user: { select: { profileName: true } },
    },
  });

  if (!trialMembership) {
    return NextResponse.json({ message: "Team member not found." }, { status: 404 });
  }

  if (parsed.data.action === "remove-member") {
    if (trialMembership.userId === user.id) {
      return NextResponse.json(
        { message: "Use leave team instead of kicking yourself." },
        { status: 400 },
      );
    }

    if (!canRemoveMember(team.memberships[0]?.role, trialMembership.role)) {
      return NextResponse.json({ message: "Team captains cannot be kicked." }, { status: 403 });
    }

    if (trialMembership.role === "TRIAL") {
      const declineData = await teamApplicationDeclineData();

      await prisma.$transaction([
        prisma.teamMembership.delete({ where: { id: trialMembership.id } }),
        prisma.teamApplication.updateMany({
          where: {
            teamId: team.id,
            userId,
          },
          data: declineData,
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.teamMembership.delete({ where: { id: trialMembership.id } }),
        prisma.teamApplication.deleteMany({
          where: {
            teamId: team.id,
            userId,
            status: "APPROVED",
          },
        }),
      ]);
    }
    await recalculateTeamRank(team.id);

    return NextResponse.json({ message: `${trialMembership.user.profileName} was kicked from the team.` });
  }

  if (trialMembership.role !== "TRIAL") {
    return NextResponse.json({ message: "Only trial players can use this action." }, { status: 409 });
  }

  if (parsed.data.action === "promote-trial") {
    await prisma.teamMembership.update({
      where: { id: trialMembership.id },
      data: { role: "PLAYER" },
    });

    return NextResponse.json({ message: `${trialMembership.user.profileName} joined the official roster.` });
  }

  const declineData = await teamApplicationDeclineData();

  await prisma.$transaction([
    prisma.teamMembership.delete({ where: { id: trialMembership.id } }),
    prisma.teamApplication.updateMany({
      where: {
        teamId: team.id,
        userId,
      },
      data: declineData,
    }),
  ]);
  await recalculateTeamRank(team.id);

  return NextResponse.json({ message: `${trialMembership.user.profileName} was removed from trial.` });
}
