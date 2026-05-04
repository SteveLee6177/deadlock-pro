import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import {
  createTeamInviteExpiry,
  createTeamInviteToken,
  getTeamInviteUrl,
} from "@/lib/team-invites";

const TEAM_INVITE_MANAGER_ROLES = new Set(["OWNER", "MANAGER"]);

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so team invites cannot be changed yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { slug } = await context.params;
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

  if (!TEAM_INVITE_MANAGER_ROLES.has(team.memberships[0]?.role ?? "")) {
    return NextResponse.json(
      { message: "Only team owners and managers can create invite links." },
      { status: 403 },
    );
  }

  const inviteToken = createTeamInviteToken();
  const inviteExpiresAt = createTeamInviteExpiry();

  await prisma.team.update({
    where: { id: team.id },
    data: {
      inviteToken,
      inviteExpiresAt,
    },
  });

  return NextResponse.json({
    invite: {
      url: getTeamInviteUrl(inviteToken),
      expiresAt: inviteExpiresAt.toISOString(),
    },
  });
}
