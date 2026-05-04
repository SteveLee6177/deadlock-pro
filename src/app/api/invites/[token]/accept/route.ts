import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { isActiveTeamInvite } from "@/lib/team-invites";
import { recalculateTeamRank } from "@/lib/team-ranks";

const acceptInviteSchema = z.object({
  leaveCurrentTeam: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so team invites cannot be accepted yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const [{ token }, body] = await Promise.all([
    context.params,
    request.json().catch(() => ({})),
  ]);
  const parsed = acceptInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Check the invite details and try again." }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      name: true,
      inviteExpiresAt: true,
    },
  });

  if (!team || !isActiveTeamInvite(team.inviteExpiresAt)) {
    return NextResponse.json({ message: "This invite link has expired." }, { status: 410 });
  }

  const currentMembership = await prisma.teamMembership.findFirst({
    where: { userId: user.id },
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
  });

  if (currentMembership?.teamId === team.id) {
    return NextResponse.json({
      status: "already-on-team",
      message: "You're on this team already.",
    });
  }

  if (currentMembership && !parsed.data.leaveCurrentTeam) {
    return NextResponse.json(
      {
        status: "current-team-conflict",
        currentTeam: {
          name: currentMembership.team.name,
          role: currentMembership.role,
        },
        message: `Leave ${currentMembership.team.name} before accepting this invite.`,
      },
      { status: 409 },
    );
  }

  if (currentMembership?.role === "OWNER") {
    return NextResponse.json(
      {
        status: "owner-transfer-required",
        message: `Transfer ownership of ${currentMembership.team.name} before accepting another team invite.`,
      },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    ...(currentMembership
      ? [
          prisma.teamMembership.delete({ where: { id: currentMembership.id } }),
          prisma.teamApplication.deleteMany({
            where: {
              teamId: currentMembership.teamId,
              userId: user.id,
              status: "APPROVED",
            },
          }),
        ]
      : []),
    prisma.teamApplication.deleteMany({
      where: {
        teamId: team.id,
        userId: user.id,
      },
    }),
    prisma.teamMembership.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "PLAYER",
      },
    }),
  ]);
  await Promise.all([
    recalculateTeamRank(team.id),
    ...(currentMembership ? [recalculateTeamRank(currentMembership.teamId)] : []),
  ]);

  return NextResponse.json({
    status: "joined",
    message: `You joined ${team.name}.`,
  });
}
