import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { teamApplicationDeclineData } from "@/lib/team-applications";

const playerApplicationActionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
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

  const [{ id }, body] = await Promise.all([
    context.params,
    request.json().catch(() => null),
  ]);
  const parsed = playerApplicationActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a valid application action." }, { status: 400 });
  }

  const application = await prisma.teamApplication.findFirst({
    where: { id, userId: user.id },
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  if (application.status !== "APPROVED") {
    return NextResponse.json({ message: "This application does not have an active invitation." }, { status: 409 });
  }

  if (parsed.data.action === "decline") {
    await prisma.teamApplication.update({
      where: { id: application.id },
      data: await teamApplicationDeclineData(),
    });

    return NextResponse.json({ message: `Declined ${application.team.name}'s invite.` });
  }

  const currentMembership = await prisma.teamMembership.findFirst({
    where: { userId: user.id },
    include: { team: { select: { id: true, name: true } } },
  });

  if (currentMembership?.teamId === application.teamId) {
    return NextResponse.json({ message: `You are already on ${application.team.name}.` });
  }

  if (currentMembership) {
    return NextResponse.json(
      { message: `Leave ${currentMembership.team.name} before accepting another team invite.` },
      { status: 409 },
    );
  }

  await prisma.teamMembership.create({
    data: {
      teamId: application.teamId,
      userId: user.id,
      role: "PLAYER",
    },
  });

  return NextResponse.json({ message: `You joined ${application.team.name}.` });
}
