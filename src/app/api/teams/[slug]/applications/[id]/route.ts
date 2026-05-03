import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import {
  teamApplicationDeclineData,
  teamApplicationInviteData,
} from "@/lib/team-applications";

const applicationActionSchema = z.object({
  action: z.enum(["invite", "decline"]),
});

const TEAM_APPLICATION_MANAGER_ROLES = new Set(["OWNER", "MANAGER"]);

function canManageApplications(role: string | null | undefined) {
  return Boolean(role && TEAM_APPLICATION_MANAGER_ROLES.has(role));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so applications cannot be changed yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const [{ slug, id }, body] = await Promise.all([
    context.params,
    request.json().catch(() => null),
  ]);
  const parsed = applicationActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a valid application action." }, { status: 400 });
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

  if (!canManageApplications(team.memberships[0]?.role)) {
    return NextResponse.json({ message: "Only team owners and managers can manage applications." }, { status: 403 });
  }

  const application = await prisma.teamApplication.findFirst({
    where: { id, teamId: team.id },
    include: { user: { select: { profileName: true } } },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  if (application.status !== "PENDING") {
    return NextResponse.json({ message: "This application has already been handled." }, { status: 409 });
  }

  if (parsed.data.action === "decline") {
    await prisma.teamApplication.update({
      where: { id: application.id },
      data: await teamApplicationDeclineData(),
    });

    return NextResponse.json({ message: `Declined ${application.user.profileName}.` });
  }

  const existingMembership = await prisma.teamMembership.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: application.userId,
      },
    },
    select: { role: true },
  });

  if (existingMembership) {
    return NextResponse.json({ message: "This player is already on the team." }, { status: 409 });
  }

  await prisma.teamApplication.update({
    where: { id: application.id },
    data: await teamApplicationInviteData(),
  });

  return NextResponse.json({ message: `Invited ${application.user.profileName} to join the roster.` });
}
